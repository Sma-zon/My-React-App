import React, { useRef, useEffect, useState } from 'react';

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
  return shape[0].map((_, i) => shape.map(row => row[i]).reverse());
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

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!running) return;
    function handleKeyDown(e) {
      if (gameOver) return;
      if (e.key.toLowerCase() === 'a' && canMove(board, piece, -1, 0)) setPiece(p => ({ ...p, x: p.x - 1 }));
      if (e.key.toLowerCase() === 'd' && canMove(board, piece, 1, 0)) setPiece(p => ({ ...p, x: p.x + 1 }));
      if (e.key.toLowerCase() === 's' && canMove(board, piece, 0, 1)) setPiece(p => ({ ...p, y: p.y + 1 }));
      if (e.key.toLowerCase() === 'w') {
        const rotated = rotate(piece.shape);
        if (canMove(board, piece, 0, 0, rotated)) setPiece(p => ({ ...p, shape: rotated }));
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [board, piece, gameOver, running]);

  useEffect(() => {
    if (!running) return;
    interval.current = setInterval(() => {
      if (canMove(board, piece, 0, 1)) {
        setPiece(p => ({ ...p, y: p.y + 1 }));
      } else {
        const merged = merge(board, piece);
        const { board: cleared, lines } = clearLines(merged);
        setScore(s => s + lines * 100);
        const next = randomPiece();
        if (!canMove(cleared, next, 0, 0)) {
          setGameOver(true);
          setBoard(cleared);
        } else {
          setBoard(cleared);
          setPiece(next);
        }
      }
    }, 350);
    return () => clearInterval(interval.current);
  }, [board, piece, gameOver, running]);

  // Touch controls
  const handleTouchMove = (direction) => {
    if (!running || gameOver) return;
    if (direction === 'left' && canMove(board, piece, -1, 0)) {
      setPiece(p => ({ ...p, x: p.x - 1 }));
    } else if (direction === 'right' && canMove(board, piece, 1, 0)) {
      setPiece(p => ({ ...p, x: p.x + 1 }));
    } else if (direction === 'down' && canMove(board, piece, 0, 1)) {
      setPiece(p => ({ ...p, y: p.y + 1 }));
    } else if (direction === 'rotate') {
      const rotated = rotate(piece.shape);
      if (canMove(board, piece, 0, 0, rotated)) {
        setPiece(p => ({ ...p, shape: rotated }));
      }
    }
  };

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
    setBoard(Array(ROWS).fill().map(() => Array(COLS).fill(0)));
    setPiece(randomPiece());
    setScore(0);
    setGameOver(false);
    setRunning(true);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2 style={{ fontFamily: 'monospace', color: '#00ff00', textShadow: '2px 2px #000' }}>Tetris</h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${COLS}, ${BLOCK}px)`,
        gridTemplateRows: `repeat(${ROWS}, ${BLOCK}px)`,
        gap: 1,
        background: '#111',
        marginBottom: 16
      }}>
        {board.map((row, y) => row.map((cell, x) => {
          let color = COLORS[cell];
          // Draw current piece
          for (let py = 0; py < piece.shape.length; py++) {
            for (let px = 0; px < piece.shape[py].length; px++) {
              if (
                piece.shape[py][px] &&
                piece.x + px === x &&
                piece.y + py === y
              ) {
                color = COLORS[piece.shape[py][px]];
              }
            }
          }
          return <div key={x + '-' + y} style={{ width: BLOCK, height: BLOCK, background: color, border: '1px solid #0f0' }} />;
        }))}
      </div>
      <div style={{ color: '#0f0', fontFamily: 'monospace', marginBottom: 8 }}>Score: {score}</div>
      {gameOver && <div style={{ color: '#f00', fontFamily: 'monospace', marginBottom: 8 }}>Game Over</div>}
      {(!running || gameOver) && (
        <button onClick={handleStart} style={{ fontFamily: 'monospace', fontSize: '1.2rem', background: '#222', color: '#0f0', border: '2px solid #0f0', padding: '8px 16px', cursor: 'pointer' }}>
          {score === 0 ? 'Start' : 'Restart'}
        </button>
      )}
      
      {/* Fullscreen Button */}
      <button
        onClick={handleFullscreen}
        style={{
          fontFamily: 'monospace',
          fontSize: '1rem',
          background: '#222',
          color: '#0f0',
          border: '2px solid #0f0',
          padding: '8px 16px',
          cursor: 'pointer',
          marginTop: 8,
          touchAction: 'manipulation'
        }}
      >
        {document.fullscreenElement ? 'Exit Fullscreen' : 'Fullscreen'}
      </button>
      
      {/* Touch Controls for Mobile */}
      {isMobile && running && !gameOver && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: 15, 
          marginTop: 20,
          width: 280,
          padding: '0 20px'
        }}>
          <div></div>
          <button
            onClick={() => handleTouchMove('rotate')}
            style={{
              width: 80,
              height: 80,
              fontSize: '1.2rem',
              background: '#222',
              color: '#0f0',
              border: '3px solid #0f0',
              borderRadius: '50%',
              cursor: 'pointer',
              fontFamily: 'monospace',
              touchAction: 'manipulation'
            }}
          >
            Rotate
          </button>
          <div></div>
          
          <button
            onClick={() => handleTouchMove('left')}
            style={{
              width: 80,
              height: 80,
              fontSize: '2rem',
              background: '#222',
              color: '#0f0',
              border: '3px solid #0f0',
              borderRadius: '50%',
              cursor: 'pointer',
              fontFamily: 'monospace',
              touchAction: 'manipulation'
            }}
          >
            ←
          </button>
          <button
            onClick={() => handleTouchMove('down')}
            style={{
              width: 80,
              height: 80,
              fontSize: '2rem',
              background: '#222',
              color: '#0f0',
              border: '3px solid #0f0',
              borderRadius: '50%',
              cursor: 'pointer',
              fontFamily: 'monospace',
              touchAction: 'manipulation'
            }}
          >
            ↓
          </button>
          <button
            onClick={() => handleTouchMove('right')}
            style={{
              width: 80,
              height: 80,
              fontSize: '2rem',
              background: '#222',
              color: '#0f0',
              border: '3px solid #0f0',
              borderRadius: '50%',
              cursor: 'pointer',
              fontFamily: 'monospace',
              touchAction: 'manipulation'
            }}
          >
            →
          </button>
        </div>
      )}
      
      <div style={{ color: '#0f0', fontFamily: 'monospace', marginTop: 8 }}>Controls: W/A/S/D</div>
    </div>
  );
}

export default Tetris; 