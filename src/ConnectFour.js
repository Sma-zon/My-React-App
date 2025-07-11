import React, { useState, useEffect } from 'react';
import soundManager from './sounds';
import { Link } from 'react-router-dom';

const ROWS = 6;
const COLS = 7;

function ConnectFour() {
  const [board, setBoard] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [gameMode, setGameMode] = useState('two-player'); // 'two-player' or 'single-player'
  const [gameWon, setGameWon] = useState(false);
  const [winner, setWinner] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize game
  const initializeGame = (mode = gameMode) => {
    const newBoard = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
    setBoard(newBoard);
    setCurrentPlayer(1);
    setGameWon(false);
    setWinner(null);
    setGameMode(mode);
    setAiThinking(false);
    soundManager.buttonClick();
  };

  // Check if column is full
  const isColumnFull = (col) => {
    return board[0][col] !== 0;
  };

  // Get the lowest empty row in a column
  const getLowestEmptyRow = (col) => {
    for (let row = ROWS - 1; row >= 0; row--) {
      if (board[row][col] === 0) {
        return row;
      }
    }
    return -1;
  };

  // Check for win condition
  const checkWin = (board, row, col, player) => {
    const directions = [
      [0, 1],   // horizontal
      [1, 0],   // vertical
      [1, 1],   // diagonal down-right
      [1, -1]   // diagonal down-left
    ];

    for (const [dr, dc] of directions) {
      let count = 1;
      
      // Check in positive direction
      for (let i = 1; i < 4; i++) {
        const newRow = row + dr * i;
        const newCol = col + dc * i;
        if (newRow < 0 || newRow >= ROWS || newCol < 0 || newCol >= COLS || board[newRow][newCol] !== player) {
          break;
        }
        count++;
      }
      
      // Check in negative direction
      for (let i = 1; i < 4; i++) {
        const newRow = row - dr * i;
        const newCol = col - dc * i;
        if (newRow < 0 || newRow >= ROWS || newCol < 0 || newCol >= COLS || board[newRow][newCol] !== player) {
          break;
        }
        count++;
      }
      
      if (count >= 4) return true;
    }
    return false;
  };

  // Check for draw
  const isDraw = (board) => {
    return board[0].every(cell => cell !== 0);
  };

  // AI move (simple minimax with alpha-beta pruning)
  const getAIMove = (board) => {
    let bestScore = -Infinity;
    let bestMove = 0;
    
    for (let col = 0; col < COLS; col++) {
      if (!isColumnFull(col)) {
        const row = getLowestEmptyRow(col);
        if (row !== -1) {
          const newBoard = board.map(row => [...row]);
          newBoard[row][col] = 2;
          
          const score = minimax(newBoard, 3, false, -Infinity, Infinity);
          if (score > bestScore) {
            bestScore = score;
            bestMove = col;
          }
        }
      }
    }
    
    return bestMove;
  };

  // Minimax algorithm with alpha-beta pruning
  const minimax = (board, depth, isMaximizing, alpha, beta) => {
    // Check for terminal states
    for (let col = 0; col < COLS; col++) {
      if (!isColumnFull(col)) {
        const row = getLowestEmptyRow(col);
        if (row !== -1) {
          if (checkWin(board, row, col, 1)) return -1000;
          if (checkWin(board, row, col, 2)) return 1000;
        }
      }
    }
    
    if (isDraw(board) || depth === 0) return 0;
    
    if (isMaximizing) {
      let maxScore = -Infinity;
      for (let col = 0; col < COLS; col++) {
        if (!isColumnFull(col)) {
          const row = getLowestEmptyRow(col);
          if (row !== -1) {
            const newBoard = board.map(row => [...row]);
            newBoard[row][col] = 2;
            const score = minimax(newBoard, depth - 1, false, alpha, beta);
            maxScore = Math.max(maxScore, score);
            alpha = Math.max(alpha, score);
            if (beta <= alpha) break;
          }
        }
      }
      return maxScore;
    } else {
      let minScore = Infinity;
      for (let col = 0; col < COLS; col++) {
        if (!isColumnFull(col)) {
          const row = getLowestEmptyRow(col);
          if (row !== -1) {
            const newBoard = board.map(row => [...row]);
            newBoard[row][col] = 1;
            const score = minimax(newBoard, depth - 1, true, alpha, beta);
            minScore = Math.min(minScore, score);
            beta = Math.min(beta, score);
            if (beta <= alpha) break;
          }
        }
      }
      return minScore;
    }
  };

  // Handle column click
  const handleColumnClick = (col) => {
    if (gameWon || isColumnFull(col) || (gameMode === 'single-player' && currentPlayer === 2 && aiThinking)) {
      return;
    }

    const row = getLowestEmptyRow(col);
    if (row === -1) return;

    soundManager.connectFourDrop();

    const newBoard = board.map(row => [...row]);
    newBoard[row][col] = currentPlayer;
    setBoard(newBoard);

    // Check for win
    if (checkWin(newBoard, row, col, currentPlayer)) {
      setGameWon(true);
      setWinner(currentPlayer);
      soundManager.connectFourWin();
      return;
    }

    // Check for draw
    if (isDraw(newBoard)) {
      setGameWon(true);
      setWinner('draw');
      return;
    }

    // Switch players
    const nextPlayer = currentPlayer === 1 ? 2 : 1;
    setCurrentPlayer(nextPlayer);
    
    // AI move in single player mode
    if (gameMode === 'single-player' && nextPlayer === 2 && !gameWon) {
      setAiThinking(true);
      setTimeout(() => {
        makeAIMove(newBoard);
        setAiThinking(false);
      }, 500);
    }
  };

  // Separate AI move function to avoid recursive calls
  const makeAIMove = (currentBoard) => {
    const aiCol = getAIMove(currentBoard);
    if (aiCol !== -1 && !isColumnFull(aiCol)) {
      const aiRow = getLowestEmptyRow(aiCol);
      if (aiRow !== -1) {
        const newBoard = currentBoard.map(row => [...row]);
        newBoard[aiRow][aiCol] = 2;
        setBoard(newBoard);
        
        soundManager.connectFourDrop();
        
        // Check for win
        if (checkWin(newBoard, aiRow, aiCol, 2)) {
          setGameWon(true);
          setWinner(2);
          soundManager.connectFourWin();
          return;
        }
        
        // Check for draw
        if (isDraw(newBoard)) {
          setGameWon(true);
          setWinner('draw');
          return;
        }
        
        // Switch back to player
        setCurrentPlayer(1);
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

  // Initialize on first load
  useEffect(() => {
    initializeGame();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2 style={{ fontFamily: 'monospace', color: '#00ff00', textShadow: '2px 2px #000' }}>Connect Four</h2>
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
      
      {/* Game Mode Selector */}
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={() => initializeGame('two-player')}
          style={{
            fontFamily: 'monospace',
            fontSize: '1rem',
            background: gameMode === 'two-player' ? '#0f0' : '#222',
            color: gameMode === 'two-player' ? '#000' : '#0f0',
            border: '2px solid #0f0',
            padding: '8px 16px',
            cursor: 'pointer',
            marginRight: 8
          }}
        >
          2 Players
        </button>
        <button
          onClick={() => initializeGame('single-player')}
          style={{
            fontFamily: 'monospace',
            fontSize: '1rem',
            background: gameMode === 'single-player' ? '#0f0' : '#222',
            color: gameMode === 'single-player' ? '#000' : '#0f0',
            border: '2px solid #0f0',
            padding: '8px 16px',
            cursor: 'pointer'
          }}
        >
          vs AI
        </button>
      </div>

      {/* Game Status */}
      <div style={{ 
        color: '#0f0', 
        fontFamily: 'monospace', 
        fontSize: '1.2rem', 
        marginBottom: 16,
        textAlign: 'center'
      }}>
        {gameWon ? (
          winner === 'draw' ? 'Draw!' : `Player ${winner} Wins!`
        ) : aiThinking ? (
          'AI is thinking...'
        ) : (
          `Player ${currentPlayer}'s Turn`
        )}
      </div>

      {/* Connect Four Board */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: `repeat(${COLS}, 1fr)`, 
        gap: 4, 
        background: '#0066ff', 
        padding: 8,
        marginBottom: 16,
        borderRadius: '8px'
      }}>
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              onClick={() => handleColumnClick(colIndex)}
              style={{
                width: isMobile ? 40 : 60,
                height: isMobile ? 40 : 60,
                background: cell === 0 
                  ? '#111' 
                  : cell === 1 
                    ? '#ff0000' 
                    : '#ffff00',
                border: '2px solid #0f0',
                borderRadius: '50%',
                cursor: isColumnFull(colIndex) ? 'default' : 'pointer',
                transition: 'all 0.3s ease',
                touchAction: 'manipulation'
              }}
            />
          ))
        )}
      </div>

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
    </div>
  );
}

export default ConnectFour; 