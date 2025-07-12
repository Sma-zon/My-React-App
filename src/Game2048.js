import React, { useState, useEffect, useRef, useCallback } from 'react';
import soundManager from './sounds';
import { Link } from 'react-router-dom';
import useScoreboard from './useScoreboard';
import ScoreEntry from './ScoreEntry';
import Leaderboard from './Leaderboard';

const BOARD_SIZE = 4;
const INIT_BOARD = () => {
  const board = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(0));
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
    board[r][c] = Math.random() < 0.9 ? 2 : 4;
  }
}

function clone(board) {
  return board.map(row => [...row]);
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
  const newBoard = board.map(row => {
    let arr = row.filter(x => x);
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] && arr[i] === arr[i + 1]) {
        arr[i] *= 2;
        score += arr[i];
        arr[i + 1] = 0;
      }
    }
    arr = arr.filter(x => x);
    while (arr.length < BOARD_SIZE) arr.push(0);
    if (arr.some((v, i) => v !== row[i])) moved = true;
    return arr;
  });
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
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [running, setRunning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const touchStart = useRef({ x: 0, y: 0 });
  
  // Scoreboard functionality
  const {
    showScoreEntry,
    showLeaderboard,
    handleGameOver,
    handleScoreSubmit,
    handleScoreCancel,
    handleLeaderboardClose,
    showLeaderboardManually,
    getTopScore
  } = useScoreboard('2048');

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
      setScore(s => s + addScore);
      
      if (isGameOver(newBoard)) {
        soundManager.game2048GameOver();
        setGameOver(true);
        handleGameOver(score + addScore);
      }
    }
  }, [board, handleGameOver, score]);



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
            display: 'grid',
            gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
            gap: 8,
            width: '100%',
            aspectRatio: '1',
          }}
        >
          {board.map((row, r) =>
            row.map((cell, c) => (
              <div
                key={r + '-' + c}
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  fontSize: isMobile ? '2.2rem' : '1.5rem',
                  background: cell ? '#222' : '#111',
                  color: cell ? '#0f0' : '#333',
                  border: '3px solid #0f0',
                  borderRadius: 12,
                  fontFamily: 'monospace',
                  touchAction: 'manipulation',
                  userSelect: 'none',
                  outline: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: cell ? '0 0 8px #0f0' : undefined,
                  transition: 'background 0.2s, color 0.2s',
                }}
              >
                {cell || ''}
              </div>
            ))
          )}
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
          score={score}
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