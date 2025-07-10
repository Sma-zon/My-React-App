import React, { useState } from 'react';

const INIT_BOARD = Array(9).fill(null);
const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function calculateWinner(board) {
  for (let line of LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

function TicTacToe() {
  const [board, setBoard] = useState([...INIT_BOARD]);
  const [xIsNext, setXIsNext] = useState(true);
  const winner = calculateWinner(board);
  const isDraw = !winner && board.every(Boolean);

  const handleClick = (index) => {
    if (board[index] || winner) return;
    const newBoard = [...board];
    newBoard[index] = xIsNext ? 'X' : 'O';
    setBoard(newBoard);
    setXIsNext(!xIsNext);
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

  const resetGame = () => {
    setBoard([...INIT_BOARD]);
    setXIsNext(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2 style={{ fontFamily: 'monospace', color: '#00ff00', textShadow: '2px 2px #000' }}>Tic-Tac-Toe</h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 60px)',
        gridTemplateRows: 'repeat(3, 60px)',
        gap: '4px',
        marginBottom: 16
      }}>
        {board.map((cell, idx) => (
          <button
            key={idx}
            onClick={() => handleClick(idx)}
            style={{
              width: 60,
              height: 60,
              fontSize: '2rem',
              fontFamily: 'monospace',
              color: cell === 'X' ? '#0ff' : '#ff0',
              background: '#111',
              border: '2px solid #0f0',
              cursor: cell || winner ? 'default' : 'pointer',
              textShadow: '2px 2px #000'
            }}
            disabled={!!cell || !!winner}
          >
            {cell}
          </button>
        ))}
      </div>
      <div style={{ color: '#0f0', fontFamily: 'monospace', marginBottom: 8 }}>
        {winner ? `Winner: ${winner}` : isDraw ? 'Draw!' : `Next: ${xIsNext ? 'X' : 'O'}`}
      </div>
      {(winner || isDraw) && (
        <button onClick={resetGame} style={{ fontFamily: 'monospace', fontSize: '1.2rem', background: '#222', color: '#0f0', border: '2px solid #0f0', padding: '8px 16px', cursor: 'pointer' }}>
          Restart
        </button>
      )}
      <button onClick={handleFullscreen} style={{ fontFamily: 'monospace', fontSize: '1.2rem', background: '#222', color: '#0f0', border: '2px solid #0f0', padding: '8px 16px', cursor: 'pointer' }}>
        {document.fullscreenElement ? 'Exit Fullscreen' : 'Fullscreen'}
      </button>
    </div>
  );
}

export default TicTacToe; 

