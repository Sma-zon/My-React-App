import React, { useState, useEffect, useRef, useCallback } from 'react';
import soundManager from './sounds';
import { Link } from 'react-router-dom';
import MobileControls from './MobileControls';

const BOARD_WIDTH = 10;
const COLS = 10;
const ROWS = 20;
const BLOCK = 24;
const COLORS = ['#000', '#0ff', '#ff0', '#f0f', '#0f0', '#f00', '#00f', '#fa0'];
const SHAPES = [
  [],
  [[1, 1, 1, 1]], // I
  [[2, 2], [2, 2]], // O
  [[0, 3, 0], [3, 3, 3]], // T
  [[4, 0, 0], [4, 4, 4]], // J
  [[0, 0, 5], [5, 5, 5]], // L
  [[6, 6, 0], [0, 6, 6]], // S
  [[0, 7, 7], [7, 7, 0]] // Z
];

function randomPiece() {
  const type = Math.floor(Math.random() * (SHAPES.length - 1)) + 1;
  return { type, shape: SHAPES[type], x: 3, y: 0 };
}

function rotate(shape) {
  const rows = shape.length;
  const cols = shape[0].length;
  const rotated = Array(cols).fill().map(() => Array(rows).fill(0));
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      rotated[c][rows - 1 - r] = shape[r][c];
    }
  }
  
  return rotated;
}

function canMove(board, piece, dx, dy, newShape) {
  const shape = newShape || piece.shape;
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x]) {
        const nx = piece.x + x + dx;
        const ny = piece.y + y + dy;
        if (nx < 0 || nx >= COLS || ny >= ROWS || (ny >= 0 && board[ny][nx])) return false;
      }
    }
  }
  return true;
}

function merge(board, piece) {
  const newBoard = board.map(row => [...row]);
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        const nx = piece.x + x;
        const ny = piece.y + y;
        if (ny >= 0) newBoard[ny][nx] = piece.shape[y][x];
      }
    }
  }
  return newBoard;
}

function clearLines(board) {
  let lines = 0;
  const newBoard = board.filter(row => !row.every(cell => cell)).map(row => [...row]);
  lines = ROWS - newBoard.length;
  while (newBoard.length < ROWS) newBoard.unshift(Array(COLS).fill(0));
  return { board: newBoard, lines };
}

function Tetris() {
  const [board, setBoard] = useState(Array(ROWS).fill().map(() => Array(COLS).fill(0)));
  const [piece, setPiece] = useState(randomPiece());
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [running, setRunning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const interval = useRef();
  const dropTime = useRef(0);

  // Fix: define canvasRef, WIDTH, HEIGHT
  const canvasRef = useRef(null);
  const WIDTH = COLS * BLOCK;
  const HEIGHT = ROWS * BLOCK;

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
    function handleKeyDown(e) {
      if (!running || gameOver) return;
      
      if (e.key.toLowerCase() === 'a' && canMove(board, piece, -1, 0)) {
        soundManager.tetrisMove();
        setPiece(p => ({ ...p, x: p.x - 1 }));
      }
      if (e.key.toLowerCase() === 'd' && canMove(board, piece, 1, 0)) {
        soundManager.tetrisMove();
        setPiece(p => ({ ...p, x: p.x + 1 }));
      }
      if (e.key.toLowerCase() === 's' && canMove(board, piece, 0, 1)) {
        soundManager.tetrisMove();
        setPiece(p => ({ ...p, y: p.y + 1 }));
        dropTime.current = 0; // Reset drop timer
      }
      if (e.key.toLowerCase() === 'w') {
        const rotated = rotate(piece.shape);
        if (canMove(board, piece, 0, 0, rotated)) {
          soundManager.tetrisRotate();
          setPiece(p => ({ ...p, shape: rotated }));
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [board, piece, gameOver, running]);

  // Game loop
  useEffect(() => {
    if (!running) return;
    
    const gameLoop = () => {
      dropTime.current += 16; // 60 FPS
      
      if (dropTime.current >= 350) {
        dropTime.current = 0;
        
        if (canMove(board, piece, 0, 1)) {
          setPiece(p => ({ ...p, y: p.y + 1 }));
        } else {
          const merged = merge(board, piece);
          const { board: cleared, lines } = clearLines(merged);
          
          if (lines > 0) {
            soundManager.tetrisLineClear();
          }
          
          setScore(s => s + lines * 100);
          const next = randomPiece();
          
          if (!canMove(cleared, next, 0, 0)) {
            soundManager.tetrisGameOver();
            setGameOver(true);
            setBoard(cleared);
          } else {
            setBoard(cleared);
            setPiece(next);
          }
        }
      }
      
      interval.current = requestAnimationFrame(gameLoop);
    };
    
    interval.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (interval.current) {
        cancelAnimationFrame(interval.current);
      }
    };
  }, [board, piece, gameOver, running]);

  // Touch controls
  const handleTouchMove = useCallback((direction) => {
    if (!running || gameOver) return;
    
    if (direction === 'left' && canMove(board, piece, -1, 0)) {
      soundManager.tetrisMove();
      setPiece(p => ({ ...p, x: p.x - 1 }));
    } else if (direction === 'right' && canMove(board, piece, 1, 0)) {
      soundManager.tetrisMove();
      setPiece(p => ({ ...p, x: p.x + 1 }));
    } else if (direction === 'down' && canMove(board, piece, 0, 1)) {
      soundManager.tetrisMove();
      setPiece(p => ({ ...p, y: p.y + 1 }));
      dropTime.current = 0;
    } else if (direction === 'rotate') {
      const rotated = rotate(piece.shape);
      if (canMove(board, piece, 0, 0, rotated)) {
        soundManager.tetrisRotate();
        setPiece(p => ({ ...p, shape: rotated }));
      }
    }
  }, [board, piece, gameOver, running]);

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
    setBoard(Array(ROWS).fill().map(() => Array(COLS).fill(0)));
    setPiece(randomPiece());
    setScore(0);
    setGameOver(false);
    setRunning(true);
    dropTime.current = 0;
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (interval.current) {
        cancelAnimationFrame(interval.current);
      }
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2 style={{ fontFamily: 'monospace', color: '#00ff00', textShadow: '2px 2px #000' }}>Tetris</h2>
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
      <div style={{ width: '100%', maxWidth: 320, aspectRatio: '0.5', margin: '0 auto', marginBottom: 16 }}>
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          style={{
            width: '100%',
            height: 'auto',
            border: '4px solid #0f0',
            background: '#111',
            display: 'block',
            boxSizing: 'border-box',
            touchAction: 'manipulation'
          }}
        />
      </div>
      <div style={{ color: '#0f0', fontFamily: 'monospace', marginBottom: 8 }}>
        Controls: {isMobile ? 'Touch D-pad below (center=rotate)' : 'W/A/S/D'}
      </div>
      {/* Mobile D-pad Controls */}
      {isMobile && running && !gameOver && (
        <MobileControls
          onUp={() => handleTouchMove('rotate')}
          onDown={() => handleTouchMove('down')}
          onLeft={() => handleTouchMove('left')}
          onRight={() => handleTouchMove('right')}
          onCenter={() => handleTouchMove('rotate')}
          showCenter={true}
        />
      )}
      
      <div style={{ color: '#0f0', fontFamily: 'monospace', marginBottom: 8 }}>Score: {score}</div>
      {gameOver && <div style={{ color: '#f00', fontFamily: 'monospace', marginBottom: 8 }}>Game Over</div>}
      {(!running || gameOver) && (
        <button onClick={handleStart} style={{ fontFamily: 'monospace', fontSize: '1.2rem', background: '#222', color: '#0f0', border: '2px solid #0f0', padding: '8px 16px', cursor: 'pointer' }}>
          {score === 0 ? 'Start' : 'Restart'}
        </button>
      )}
      
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
      
    </div>
  );
}

export default Tetris; 