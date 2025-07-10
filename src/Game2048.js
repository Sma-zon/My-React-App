import React, { useState, useEffect, useRef } from 'react';

const SIZE = 4;
const INIT_BOARD = () => {
  const board = Array(SIZE).fill().map(() => Array(SIZE).fill(0));
  addRandom(board);
  addRandom(board);
  return board;
};
function addRandom(board) {
  const empty = [];
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (!board[r][c]) empty.push([r, c]);
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
    while (arr.length < SIZE) arr.push(0);
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
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
    if (!board[r][c]) return false;
    if (c < SIZE - 1 && board[r][c] === board[r][c + 1]) return false;
    if (r < SIZE - 1 && board[r][c] === board[r + 1][c]) return false;
  }
  return true;
}

function Game2048() {
  const [board, setBoard] = useState(INIT_BOARD());
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [running, setRunning] = useState(false);

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
        const { board: newBoard, moved, score: addScore } = move(board, dir);
        if (moved) {
          addRandom(newBoard);
          setBoard(newBoard);
          setScore(s => s + addScore);
          if (isGameOver(newBoard)) setGameOver(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [board, gameOver, running]);

  function handleStart() {
    setBoard(INIT_BOARD());
    setScore(0);
    setGameOver(false);
    setRunning(true);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2 style={{ fontFamily: 'monospace', color: '#00ff00', textShadow: '2px 2px #000' }}>2048</h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${SIZE}, 60px)`,
        gridTemplateRows: `repeat(${SIZE}, 60px)`,
        gap: 6,
        marginBottom: 16
      }}>
        {board.flat().map((cell, idx) => (
          <div key={idx} style={{
            width: 60,
            height: 60,
            background: cell ? '#222' : '#111',
            color: cell ? '#0f0' : '#333',
            fontFamily: 'monospace',
            fontSize: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #0f0',
            textShadow: '1px 1px #000'
          }}>{cell || ''}</div>
        ))}
      </div>
      <div style={{ color: '#0f0', fontFamily: 'monospace', marginBottom: 8 }}>Score: {score}</div>
      {gameOver && <div style={{ color: '#f00', fontFamily: 'monospace', marginBottom: 8 }}>Game Over</div>}
      {(!running || gameOver) && (
        <button onClick={handleStart} style={{ fontFamily: 'monospace', fontSize: '1.2rem', background: '#222', color: '#0f0', border: '2px solid #0f0', padding: '8px 16px', cursor: 'pointer' }}>
          {score === 0 ? 'Start' : 'Restart'}
        </button>
      )}
      <div style={{ color: '#0f0', fontFamily: 'monospace', marginTop: 8 }}>Controls: W/A/S/D</div>
    </div>
  );
}

export default Game2048; 