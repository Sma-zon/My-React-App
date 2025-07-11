import React, { useState, useEffect } from 'react';
import soundManager from './sounds';
import { Link } from 'react-router-dom';

// Sample Sudoku puzzles for each difficulty
const SUDOKU_PUZZLES = {
  easy: [
    [5,3,0,0,7,0,0,0,0],
    [6,0,0,1,9,5,0,0,0],
    [0,9,8,0,0,0,0,6,0],
    [8,0,0,0,6,0,0,0,3],
    [4,0,0,8,0,3,0,0,1],
    [7,0,0,0,2,0,0,0,6],
    [0,6,0,0,0,0,2,8,0],
    [0,0,0,4,1,9,0,0,5],
    [0,0,0,0,8,0,0,7,9]
  ],
  medium: [
    [0,0,0,2,6,0,7,0,1],
    [6,8,0,0,7,0,0,9,0],
    [1,9,0,0,0,4,5,0,0],
    [8,2,0,1,0,0,0,4,0],
    [0,0,4,6,0,2,9,0,0],
    [0,5,0,0,0,3,0,2,8],
    [0,0,9,3,0,0,0,7,4],
    [0,4,0,0,5,0,0,3,6],
    [7,0,3,0,1,8,0,0,0]
  ],
  hard: [
    [0,0,0,6,0,0,4,0,0],
    [7,0,0,0,0,3,6,0,0],
    [0,0,0,0,9,1,0,8,0],
    [0,0,0,0,0,0,0,0,0],
    [0,5,0,1,8,0,0,0,3],
    [0,0,0,3,0,6,0,4,5],
    [0,4,0,2,0,0,0,6,0],
    [9,0,3,0,0,0,0,0,0],
    [0,2,0,0,0,0,1,0,0]
  ]
};

function Sudoku() {
  const [board, setBoard] = useState([]);
  const [originalBoard, setOriginalBoard] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const [difficulty, setDifficulty] = useState('easy');
  const [isMobile, setIsMobile] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Timer effect
  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // Initialize game
  const initializeGame = (newDifficulty = difficulty) => {
    const puzzle = SUDOKU_PUZZLES[newDifficulty];
    setBoard(puzzle.map(row => [...row]));
    setOriginalBoard(puzzle.map(row => [...row]));
    setSelectedCell(null);
    setGameWon(false);
    setTimer(0);
    setIsRunning(true);
    soundManager.buttonClick();
  };

  // Check if number is valid in position
  const isValid = (board, row, col, num) => {
    // Check row
    for (let x = 0; x < 9; x++) {
      if (board[row][x] === num) return false;
    }
    
    // Check column
    for (let x = 0; x < 9; x++) {
      if (board[x][col] === num) return false;
    }
    
    // Check 3x3 box
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[i + startRow][j + startCol] === num) return false;
      }
    }
    
    return true;
  };

  // Solve Sudoku using backtracking
  const solveSudoku = (board) => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0) {
          for (let num = 1; num <= 9; num++) {
            if (isValid(board, row, col, num)) {
              board[row][col] = num;
              if (solveSudoku(board)) {
                return true;
              }
              board[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  };

  // Handle cell click
  const handleCellClick = (row, col) => {
    if (originalBoard[row][col] !== 0) return; // Can't edit original numbers
    setSelectedCell({ row, col });
    soundManager.sudokuPlace();
  };

  // Handle number input
  const handleNumberInput = (num) => {
    if (!selectedCell) return;
    
    const { row, col } = selectedCell;
    const newBoard = board.map(row => [...row]);
    
    if (num === 0) {
      newBoard[row][col] = 0;
    } else {
      if (isValid(newBoard, row, col, num)) {
        newBoard[row][col] = num;
        soundManager.sudokuPlace();
      } else {
        soundManager.sudokuError();
        return;
      }
    }
    
    setBoard(newBoard);
    
    // Check if puzzle is complete
    if (isPuzzleComplete(newBoard)) {
      setGameWon(true);
      setIsRunning(false);
      soundManager.sudokuComplete();
    }
  };

  // Check if puzzle is complete
  const isPuzzleComplete = (board) => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0) return false;
      }
    }
    return true;
  };

  // Handle solve button
  const handleSolve = () => {
    const solvedBoard = board.map(row => [...row]);
    if (solveSudoku(solvedBoard)) {
      setBoard(solvedBoard);
      setGameWon(true);
      setIsRunning(false);
      soundManager.sudokuComplete();
    }
  };

  // Handle difficulty change
  const handleDifficultyChange = (newDifficulty) => {
    setDifficulty(newDifficulty);
    initializeGame(newDifficulty);
  };

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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

  // Initialize on first load
  useEffect(() => {
    initializeGame();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2 style={{ fontFamily: 'monospace', color: '#00ff00', textShadow: '2px 2px #000' }}>Sudoku</h2>
      <button 
        onClick={() => window.location.href = '/'}
        style={{
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
        }}
      >
        Back to Main Menu
      </button>
      
      {/* Difficulty Selector */}
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={() => handleDifficultyChange('easy')}
          style={{
            fontFamily: 'monospace',
            fontSize: '1rem',
            background: difficulty === 'easy' ? '#0f0' : '#222',
            color: difficulty === 'easy' ? '#000' : '#0f0',
            border: '2px solid #0f0',
            padding: '8px 16px',
            cursor: 'pointer',
            marginRight: 8
          }}
        >
          Easy
        </button>
        <button
          onClick={() => handleDifficultyChange('medium')}
          style={{
            fontFamily: 'monospace',
            fontSize: '1rem',
            background: difficulty === 'medium' ? '#0f0' : '#222',
            color: difficulty === 'medium' ? '#000' : '#0f0',
            border: '2px solid #0f0',
            padding: '8px 16px',
            cursor: 'pointer',
            marginRight: 8
          }}
        >
          Medium
        </button>
        <button
          onClick={() => handleDifficultyChange('hard')}
          style={{
            fontFamily: 'monospace',
            fontSize: '1rem',
            background: difficulty === 'hard' ? '#0f0' : '#222',
            color: difficulty === 'hard' ? '#000' : '#0f0',
            border: '2px solid #0f0',
            padding: '8px 16px',
            cursor: 'pointer'
          }}
        >
          Hard
        </button>
      </div>

      {/* Timer */}
      <div style={{ color: '#0f0', fontFamily: 'monospace', marginBottom: 16 }}>
        Time: {formatTime(timer)}
      </div>

      {/* Sudoku Board */}
      <div style={{ width: '100%', maxWidth: 400, margin: '0 auto', marginBottom: 16 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(9, 1fr)`,
            gap: 4,
            width: '100%',
            aspectRatio: '1',
          }}
        >
          {board.map((row, r) =>
            row.map((cell, c) => (
              <button
                key={r + '-' + c}
                onClick={() => handleCellClick(r, c)}
                disabled={isCellDisabled(r, c)}
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  fontSize: isMobile ? '1.5rem' : '1.1rem',
                  background: getCellColor(cell),
                  color: '#0f0',
                  border: '2px solid #0f0',
                  borderRadius: 6,
                  cursor: isCellDisabled(r, c) ? 'default' : 'pointer',
                  fontFamily: 'monospace',
                  touchAction: 'manipulation',
                  userSelect: 'none',
                  outline: 'none',
                  transition: 'background 0.2s',
                }}
              >
                {cell.value || ''}
              </button>
            ))
          )}
        </div>
      </div>
      {/* Number pad for mobile */}
      {isMobile && (
        <div style={{ width: '100%', maxWidth: 400, margin: '0 auto', marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, width: '100%' }}>
            {[1,2,3,4,5,6,7,8,9,0].map(num => (
              <button
                key={num}
                onClick={() => handleNumberInput(num)}
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  fontSize: '1.5rem',
                  background: '#222',
                  color: '#0f0',
                  border: '3px solid #0f0',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                  touchAction: 'manipulation',
                  userSelect: 'none',
                  outline: 'none',
                  marginBottom: 4,
                }}
              >
                {num === 0 ? 'Clear' : num}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <button
          onClick={() => initializeGame()}
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
          New Game
        </button>
        <button
          onClick={handleSolve}
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
          Solve
        </button>
      </div>

      {/* Win Message */}
      {gameWon && (
        <div style={{ 
          color: '#0f0', 
          fontFamily: 'monospace', 
          fontSize: '1.5rem', 
          marginBottom: 16,
          textAlign: 'center'
        }}>
          🎉 Puzzle Complete! 🎉
        </div>
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

export default Sudoku; 