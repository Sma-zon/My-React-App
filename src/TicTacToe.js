import React, { useState, useEffect } from 'react';
import soundManager from './sounds';
import { Link } from 'react-router-dom';

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
  const [gameHistory, setGameHistory] = useState([]);
  const winner = calculateWinner(board);
  const isDraw = !winner && board.every(Boolean);

  const handleClick = (index) => {
    if (board[index] || winner || isDraw) return;
    
    soundManager.ticTacToeClick();
    const newBoard = [...board];
    newBoard[index] = xIsNext ? 'X' : 'O';
    setBoard(newBoard);
    setXIsNext(!xIsNext);
    
    // Add to history
    setGameHistory(prev => [...prev, { board: [...newBoard], player: xIsNext ? 'X' : 'O' }]);
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
    soundManager.buttonClick();
    setBoard([...INIT_BOARD]);
    setXIsNext(true);
    setGameHistory([]);
  };

  const undoMove = () => {
    if (gameHistory.length === 0) return;
    
    soundManager.buttonClick();
    const newHistory = gameHistory.slice(0, -1);
    setGameHistory(newHistory);
    
    if (newHistory.length === 0) {
      setBoard([...INIT_BOARD]);
      setXIsNext(true);
    } else {
      const lastMove = newHistory[newHistory.length - 1];
      setBoard(lastMove.board);
      setXIsNext(lastMove.player === 'O'); // Next player is opposite of last player
    }
  };

  // Check for win after each move
  useEffect(() => {
    if (winner) {
      soundManager.ticTacToeWin();
    }
  }, [winner]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2 style={{ fontFamily: 'monospace', color: '#00ff00', textShadow: '2px 2px #000' }}>Tic-Tac-Toe</h2>
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
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        {gameHistory.length > 0 && !winner && !isDraw && (
          <button onClick={undoMove} style={{ fontFamily: 'monospace', fontSize: '1rem', background: '#222', color: '#0f0', border: '2px solid #0f0', padding: '6px 12px', cursor: 'pointer' }}>
            Undo
          </button>
        )}
        {(winner || isDraw) && (
          <button onClick={resetGame} style={{ fontFamily: 'monospace', fontSize: '1.2rem', background: '#222', color: '#0f0', border: '2px solid #0f0', padding: '8px 16px', cursor: 'pointer' }}>
            Restart
          </button>
        )}
      </div>
      <button onClick={() => {
        soundManager.buttonClick();
        handleFullscreen();
      }} style={{ 
        fontFamily: 'monospace', 
        fontSize: '1.2rem', 
        background: '#111', 
        color: '#0f0', 
        border: '3px solid #0f0', 
        padding: '12px 24px', 
        cursor: 'pointer',
        marginTop: 12,
        marginBottom: 8,
        boxShadow: '0 0 10px #0f0',
        borderRadius: '8px',
        fontWeight: 'bold'
      }}>
        {document.fullscreenElement ? 'Exit Fullscreen' : 'Fullscreen'}
      </button>
    </div>
  );
}

export default TicTacToe; 

