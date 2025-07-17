import React, { useState, useEffect, useRef, useCallback } from 'react';
import soundManager from './sounds';
import { Link } from 'react-router-dom';
import useScoreboard from './useScoreboard';
import ScoreEntry from './ScoreEntry';
import Leaderboard from './Leaderboard';

const BOARD_SIZE = 4;
const TILE_SIZE = 80; // px, for animation math
const TILE_GAP = 8; // px

// Helper to generate a unique id for each tile
let tileUid = 1;
function makeTileId() {
  return tileUid++;
}

const INIT_BOARD = () => {
  const board = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(null));
  addRandom(board);
  addRandom(board);
  return board;
};

function addRandom(board) {
  const empty = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (!board[r][c]) empty.push([r, c]);
    }
  }
  if (empty.length) {
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    board[r][c] = { value: Math.random() < 0.9 ? 2 : 4, id: makeTileId(), justAdded: true };
  }
}

function clone(board) {
  return board.map(row => row.map(cell => cell ? { ...cell } : null));
}

function transpose(board) {
  return board[0].map((_, c) => board.map(row => row[c]));
}

function reverse(board) {
  return board.map(row => [...row].reverse());
}

function moveLeft(board) {
  let moved = false;
  let score = 0;
  let newBoard = board.map(row => row.map(cell => cell ? { ...cell, justAdded: false } : null));
  for (let r = 0; r < BOARD_SIZE; r++) {
    let arr = newBoard[r].filter(x => x);
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] && arr[i].value === arr[i + 1].value) {
        arr[i] = { ...arr[i], value: arr[i].value * 2 };
        score += arr[i].value;
        arr[i + 1] = null;
      }
    }
    arr = arr.filter(x => x);
    while (arr.length < BOARD_SIZE) arr.push(null);
    if (arr.some((v, i) => v !== newBoard[r][i])) moved = true;
    newBoard[r] = arr;
  }
  return { board: newBoard, moved, score };
}

function move(board, dir) {
  let b = clone(board);
  let score = 0;
  
  if (dir === 'left') {
    const res = moveLeft(b);
    b = res.board;
    score = res.score;
    if (!res.moved) return { board, moved: false, score: 0 };
  } else if (dir === 'right') {
    b = reverse(b);
    const res = moveLeft(b);
    b = reverse(res.board);
    score = res.score;
    if (!res.moved) return { board, moved: false, score: 0 };
  } else if (dir === 'up') {
    b = transpose(b);
    const res = moveLeft(b);
    b = transpose(res.board);
    score = res.score;
    if (!res.moved) return { board, moved: false, score: 0 };
  } else if (dir === 'down') {
    b = transpose(b);
    b = reverse(b);
    const res = moveLeft(b);
    b = reverse(res.board);
    b = transpose(b);
    score = res.score;
    if (!res.moved) return { board, moved: false, score: 0 };
  }
  
  return { board: b, moved: true, score };
}

function isGameOver(board) {
  // Check if there are any empty cells
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (!board[r][c]) return false;
    }
  }
  
  // Check if any merges are possible
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const current = board[r][c];
      // Check right neighbor
      if (c < BOARD_SIZE - 1 && board[r][c + 1] === current) return false;
      // Check bottom neighbor
      if (r < BOARD_SIZE - 1 && board[r + 1][c] === current) return false;
    }
  }
  
  return true;
}

function Game2048() {
  const [board, setBoard] = useState(INIT_BOARD());
  const [tiles, setTiles] = useState([]); // For animation
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [running, setRunning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const touchStart = useRef({ x: 0, y: 0 });
  const currentScoreRef = useRef(0);
  
  // Scoreboard functionality
  const {
    showScoreEntry,
    showLeaderboard,
    currentScore,
    handleGameOver,
    handleScoreSubmit,
    handleScoreCancel,
    handleLeaderboardClose,
    showLeaderboardManually,
    getTopScore
  } = useScoreboard('2048');

  // Convert board to tile list for animation
  useEffect(() => {
    const newTiles = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const cell = board[r][c];
        if (cell) {
          newTiles.push({ ...cell, row: r, col: c });
        }
      }
    }
    setTiles(newTiles);
  }, [board]);

  // Handle move logic
  const handleMove = useCallback((dir) => {
    const { board: newBoard, moved, score: addScore } = move(board, dir);
    
    if (moved) {
      soundManager.game2048Move();
      if (addScore > 0) {
        soundManager.game2048Merge();
      }
      
      addRandom(newBoard);
      setBoard(newBoard);
      setScore(s => {
        const newScore = s + addScore;
        currentScoreRef.current = newScore;
        return newScore;
      });
      
      if (isGameOver(newBoard)) {
        soundManager.game2048GameOver();
        setGameOver(true);
        handleGameOver(currentScoreRef.current);
      }
    }
  }, [board, handleGameOver]);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Keyboard controls
  useEffect(() => {
    if (!running) return;
    
    const handleKeyDown = (e) => {
      if (gameOver) return;
      
      let dir = null;
      if (e.key.toLowerCase() === 'a') dir = 'left';
      if (e.key.toLowerCase() === 'd') dir = 'right';
      if (e.key.toLowerCase() === 'w') dir = 'up';
      if (e.key.toLowerCase() === 's') dir = 'down';
      
      if (dir) {
        handleMove(dir);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [board, gameOver, running, handleMove]);

  // Fullscreen functionality
  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  function handleStart() {
    soundManager.buttonClick();
    setBoard(INIT_BOARD());
    setScore(0);
    currentScoreRef.current = 0;
    setGameOver(false);
    setRunning(true);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2 style={{ fontFamily: 'monospace', color: '#00ff00', textShadow: '2px 2px #000' }}>2048</h2>
      <Link to="/" style={{
        display: 'inline-block',
        marginBottom: 16,
        fontFamily: 'monospace',
        fontSize: '1rem',
        color: '#111',
        background: '#0f0',
        border: '2px solid #0f0',
        padding: '6px 16px',
        cursor: 'pointer',
        textShadow: '1px 1px #000',
        borderRadius: 6,
        fontWeight: 'bold',
        textDecoration: 'none',
        boxShadow: '0 0 8px #0f0'
      }}>Back to Main Menu</Link>
      <div style={{ width: '100%', maxWidth: 400, margin: '0 auto', marginBottom: 16 }}>
        <div
          style={{
            position: 'relative',
            width: BOARD_SIZE * TILE_SIZE + (BOARD_SIZE - 1) * TILE_GAP,
            height: BOARD_SIZE * TILE_SIZE + (BOARD_SIZE - 1) * TILE_GAP,
            background: '#111',
            borderRadius: 16,
            border: '4px solid #0f0',
            margin: '0 auto',
            boxShadow: '0 0 16px #0f0',
            overflow: 'hidden',
          }}
        >
          {/* Render grid background */}
          {[...Array(BOARD_SIZE * BOARD_SIZE)].map((_, i) => (
            <div
              key={'bg-' + i}
              style={{
                position: 'absolute',
                width: TILE_SIZE,
                height: TILE_SIZE,
                left: (i % BOARD_SIZE) * (TILE_SIZE + TILE_GAP),
                top: Math.floor(i / BOARD_SIZE) * (TILE_SIZE + TILE_GAP),
                background: '#222',
                borderRadius: 12,
                border: '2px solid #0f0',
                boxSizing: 'border-box',
                zIndex: 0,
              }}
            />
          ))}
          {/* Render tiles */}
          {tiles.map(tile => (
            <div
              key={tile.id}
              style={{
                position: 'absolute',
                width: TILE_SIZE,
                height: TILE_SIZE,
                left: tile.col * (TILE_SIZE + TILE_GAP),
                top: tile.row * (TILE_SIZE + TILE_GAP),
                fontSize: isMobile ? '2.2rem' : '1.5rem',
                background: tile.value ? '#222' : '#111',
                color: tile.value ? '#0f0' : '#333',
                border: '3px solid #0f0',
                borderRadius: 12,
                fontFamily: 'monospace',
                touchAction: 'manipulation',
                userSelect: 'none',
                outline: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: tile.value ? '0 0 8px #0f0' : undefined,
                transition: 'left 0.18s cubic-bezier(.45,1.6,.5,1), top 0.18s cubic-bezier(.45,1.6,.5,1)',
                zIndex: 1,
                fontWeight: 'bold',
              }}
            >
              {tile.value || ''}
            </div>
          ))}
        </div>
      </div>
      <div style={{ color: '#0f0', fontFamily: 'monospace', marginBottom: 8 }}>Score: {score}</div>
      <div style={{ color: '#0f0', fontFamily: 'monospace', marginBottom: 8 }}>High Score: {getTopScore()}</div>
      {gameOver && <div style={{ color: '#f00', fontFamily: 'monospace', marginBottom: 8 }}>Game Over</div>}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        {(!running || gameOver) && (
          <button onClick={handleStart} style={{ fontFamily: 'monospace', fontSize: '1.2rem', background: '#222', color: '#0f0', border: '2px solid #0f0', padding: '8px 16px', cursor: 'pointer' }}>
            {score === 0 ? 'Start' : 'Restart'}
          </button>
        )}
        <button
          onClick={showLeaderboardManually}
          style={{
            fontFamily: 'monospace',
            fontSize: '1rem',
            background: '#222',
            color: '#0f0',
            border: '2px solid #0f0',
            padding: '8px 16px',
            cursor: 'pointer'
          }}
        >
          Leaderboard
        </button>
      </div>
      
      {/* Fullscreen Button */}
      <button
        onClick={() => {
          soundManager.buttonClick();
          handleFullscreen();
        }}
        style={{
          fontFamily: 'monospace',
          fontSize: '1.2rem',
          background: '#111',
          color: '#0f0',
          border: '3px solid #0f0',
          padding: '12px 24px',
          cursor: 'pointer',
          marginTop: 12,
          marginBottom: 8,
          touchAction: 'manipulation',
          boxShadow: '0 0 10px #0f0',
          borderRadius: '8px',
          fontWeight: 'bold'
        }}
      >
        {document.fullscreenElement ? 'Exit Fullscreen' : 'Fullscreen'}
      </button>
      
      <div style={{ color: '#0f0', fontFamily: 'monospace', marginTop: 8 }}>
        Controls: {isMobile ? 'Swipe to move' : 'W/A/S/D'}
      </div>
      
      {/* Score Entry Modal */}
      {showScoreEntry && (
        <ScoreEntry
          score={currentScore}
          gameName="2048"
          onSubmit={handleScoreSubmit}
          onCancel={handleScoreCancel}
        />
      )}
      
      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <Leaderboard
          gameName="2048"
          onClose={handleLeaderboardClose}
        />
      )}
    </div>
  );
}

export default Game2048; 