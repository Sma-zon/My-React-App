import React, { useState, useEffect, useRef } from 'react';
import soundManager from './sounds';
import useScoreboard from './useScoreboard';

const BOARD_SIZE = 10;
const MINES_COUNT = 15;
const CELL_SIZE = 30;

// Colors for different numbers
const NUMBER_COLORS = {
  1: '#0f0', // Green
  2: '#00f', // Blue
  3: '#f00', // Red
  4: '#800', // Dark Red
  5: '#008', // Dark Blue
  6: '#088', // Cyan
  7: '#000', // Black
  8: '#888'  // Gray
};

function Minesweeper() {
  const [board, setBoard] = useState([]);
  const [revealed, setRevealed] = useState([]);
  const [flagged, setFlagged] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [minesLeft, setMinesLeft] = useState(MINES_COUNT);
  const [isMobile, setIsMobile] = useState(false);
  const [explosions, setExplosions] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [completionTime, setCompletionTime] = useState(null);
  const canvasRef = useRef(null);
  const touchStartRef = useRef(null);
  
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
  } = useScoreboard('Minesweeper');

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize board
  const initializeBoard = () => {
    const newBoard = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(0));
    const newRevealed = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(false));
    const newFlagged = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(false));
    
    // Place mines
    let minesPlaced = 0;
    while (minesPlaced < MINES_COUNT) {
      const row = Math.floor(Math.random() * BOARD_SIZE);
      const col = Math.floor(Math.random() * BOARD_SIZE);
      if (newBoard[row][col] !== -1) {
        newBoard[row][col] = -1; // -1 represents a mine
        minesPlaced++;
      }
    }
    
    // Calculate numbers
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (newBoard[row][col] !== -1) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const nr = row + dr;
              const nc = col + dc;
              if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && newBoard[nr][nc] === -1) {
                count++;
              }
            }
          }
          newBoard[row][col] = count;
        }
      }
    }
    
    setBoard(newBoard);
    setRevealed(newRevealed);
    setFlagged(newFlagged);
    setGameOver(false);
    setGameWon(false);
    setMinesLeft(MINES_COUNT);
    setExplosions([]);
    setStartTime(Date.now());
    setCompletionTime(null);
  };

  // Create explosion animation
  const createExplosion = (row, col) => {
    const newExplosions = [];
    for (let i = 0; i < 20; i++) {
      newExplosions.push({
        id: Date.now() + i,
        x: col * CELL_SIZE + CELL_SIZE / 2,
        y: row * CELL_SIZE + CELL_SIZE / 2,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1.0,
        decay: 0.02 + Math.random() * 0.03
      });
    }
    setExplosions(prev => [...prev, ...newExplosions]);
  };

  // Animate explosions
  useEffect(() => {
    if (explosions.length === 0) return;
    
    const interval = setInterval(() => {
      setExplosions(prev => 
        prev.map(exp => ({
          ...exp,
          x: exp.x + exp.vx,
          y: exp.y + exp.vy,
          life: exp.life - exp.decay
        })).filter(exp => exp.life > 0)
      );
    }, 16);
    
    return () => clearInterval(interval);
  }, [explosions]);

  // Render explosion particles
  useEffect(() => {
    if (!canvasRef.current || explosions.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw explosion particles
    explosions.forEach(exp => {
      const alpha = exp.life;
      const size = (1 - exp.life) * 8 + 2;
      
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = `hsl(${30 + Math.random() * 30}, 100%, 50%)`;
      ctx.beginPath();
      ctx.arc(exp.x, exp.y, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }, [explosions]);

  // Reveal cell
  const revealCell = (row, col) => {
    if (gameOver || gameWon || revealed[row][col] || flagged[row][col]) return;
    
    const newRevealed = revealed.map(row => [...row]);
    
    if (board[row][col] === -1) {
      // Hit a mine!
      soundManager.minesweeperExplosion();
      createExplosion(row, col);
      setGameOver(true);
      // Reveal all mines
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          if (board[r][c] === -1) {
            newRevealed[r][c] = true;
          }
        }
      }
      setRevealed(newRevealed);
      return;
    }
    
    // Reveal this cell
    newRevealed[row][col] = true;
    soundManager.minesweeperReveal();
    
    // If it's a 0, reveal neighbors using a queue to avoid stack overflow
    if (board[row][col] === 0) {
      const queue = [[row, col]];
      
      while (queue.length > 0) {
        const [currentRow, currentCol] = queue.shift();
        
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = currentRow + dr;
            const nc = currentCol + dc;
            
            if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && 
                !newRevealed[nr][nc] && !flagged[nr][nc]) {
              
              newRevealed[nr][nc] = true;
              soundManager.minesweeperReveal();
              
              // If this neighbor is also 0, add it to the queue
              if (board[nr][nc] === 0) {
                queue.push([nr, nc]);
              }
            }
          }
        }
      }
    }
    
    setRevealed(newRevealed);
    
    // Check for win
    checkWin(newRevealed);
  };

  // Toggle flag
  const toggleFlag = (row, col) => {
    if (gameOver || gameWon || revealed[row][col]) return;
    
    const newFlagged = flagged.map(row => [...row]);
    newFlagged[row][col] = !newFlagged[row][col];
    setFlagged(newFlagged);
    
    if (newFlagged[row][col]) {
      soundManager.minesweeperFlag();
      setMinesLeft(prev => prev - 1);
    } else {
      soundManager.minesweeperUnflag();
      setMinesLeft(prev => prev + 1);
    }
  };

  // Check for win
  const checkWin = (newRevealed) => {
    let revealedCount = 0;
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (newRevealed[row][col]) revealedCount++;
      }
    }
    
    if (revealedCount === BOARD_SIZE * BOARD_SIZE - MINES_COUNT) {
      const time = Math.floor((Date.now() - startTime) / 1000);
      setCompletionTime(time);
      soundManager.minesweeperWin();
      setGameWon(true);
      handleGameOver(time);
    }
  };

  // Handle right click (flag)
  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault();
    };
    
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  // Touch controls for mobile
  const handleTouchStart = (e, row, col) => {
    if (isMobile) {
      e.preventDefault();
      const touch = e.touches[0];
      touchStartRef.current = { 
        x: touch.clientX, 
        y: touch.clientY, 
        row, 
        col, 
        startTime: Date.now() 
      };
    }
  };

  const handleTouchEnd = (e, row, col) => {
    if (isMobile && touchStartRef.current) {
      e.preventDefault();
      const touch = e.changedTouches[0];
      const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
      const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
      const longPress = deltaX < 10 && deltaY < 10 && (Date.now() - touchStartRef.current.startTime) > 500;
      
      if (longPress) {
        toggleFlag(row, col);
      } else {
        revealCell(row, col);
      }
      touchStartRef.current = null;
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

  // Initialize game on first load
  useEffect(() => {
    initializeBoard();
  }, []);

  const renderCell = (row, col) => {
    const isRevealed = revealed[row][col];
    const isFlagged = flagged[row][col];
    const cellValue = board[row][col];
    
    let cellContent = '';
    let cellStyle = {
      width: CELL_SIZE,
      height: CELL_SIZE,
      border: '1px solid #0f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'monospace',
      fontSize: '14px',
      fontWeight: 'bold',
      cursor: 'pointer',
      userSelect: 'none'
    };
    
    if (isFlagged) {
      cellContent = '🚩';
      cellStyle.background = '#222';
      cellStyle.color = '#f00';
    } else if (!isRevealed) {
      cellStyle.background = '#111';
      cellStyle.color = '#0f0';
    } else {
      if (cellValue === -1) {
        cellContent = '💣';
        cellStyle.background = '#f00';
        cellStyle.color = '#000';
      } else if (cellValue === 0) {
        cellStyle.background = '#222';
        cellStyle.color = '#0f0';
      } else {
        cellContent = cellValue.toString();
        cellStyle.background = '#222';
        cellStyle.color = NUMBER_COLORS[cellValue] || '#0f0';
      }
    }
    
    return (
      <div
        key={`${row}-${col}`}
        style={cellStyle}
        onClick={() => !isMobile && revealCell(row, col)}
        onContextMenu={(e) => {
          e.preventDefault();
          !isMobile && toggleFlag(row, col);
        }}
        onTouchStart={(e) => handleTouchStart(e, row, col)}
        onTouchEnd={(e) => handleTouchEnd(e, row, col)}
        onTouchMove={(e) => e.preventDefault()}
      >
        {cellContent}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2 style={{ fontFamily: 'monospace', color: '#00ff00', textShadow: '2px 2px #000' }}>Minesweeper</h2>
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
      
      {/* Game Info */}
      <div style={{ color: '#0f0', fontFamily: 'monospace', marginBottom: 8 }}>
        Mines Left: {minesLeft}
        {startTime && !gameWon && !gameOver && (
          <span style={{ marginLeft: 16 }}>
            Time: {Math.floor((Date.now() - startTime) / 1000)}s
          </span>
        )}
        {completionTime && (
          <span style={{ marginLeft: 16 }}>
            Completed in: {completionTime}s
          </span>
        )}
      </div>
      
      {/* Game Board */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${BOARD_SIZE}, ${CELL_SIZE}px)`,
          gap: 0,
          background: '#111',
          border: '2px solid #0f0'
        }}>
          {board.map((row, rowIndex) => 
            row.map((cell, colIndex) => renderCell(rowIndex, colIndex))
          )}
        </div>
        
        {/* Explosion Canvas */}
        <canvas
          ref={canvasRef}
          width={BOARD_SIZE * CELL_SIZE}
          height={BOARD_SIZE * CELL_SIZE}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            zIndex: 10
          }}
        />
      </div>
      
      {/* Game Status */}
      {gameOver && (
        <div style={{ color: '#f00', fontFamily: 'monospace', fontSize: '1.2rem', marginBottom: 8 }}>
          💥 Game Over! 💥
        </div>
      )}
      {gameWon && (
        <div style={{ color: '#0f0', fontFamily: 'monospace', fontSize: '1.2rem', marginBottom: 8 }}>
          🎉 You Won! 🎉
        </div>
      )}
      
      {/* Controls */}
      <div style={{ color: '#0f0', fontFamily: 'monospace', marginBottom: 8 }}>
        Controls: {isMobile ? 'Tap to reveal, Long press to flag' : 'Left click to reveal, Right click to flag'}
      </div>
      
      {/* Restart Button */}
      {(gameOver || gameWon) && (
        <button 
          onClick={() => {
            soundManager.buttonClick();
            initializeBoard();
          }} 
          style={{ 
            fontFamily: 'monospace', 
            fontSize: '1.2rem', 
            background: '#222', 
            color: '#0f0', 
            border: '2px solid #0f0', 
            padding: '8px 16px', 
            cursor: 'pointer',
            marginBottom: 8
          }}
        >
          New Game
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
          marginTop: 8,
          marginBottom: 8,
          touchAction: 'manipulation',
          boxShadow: '0 0 10px #0f0',
          borderRadius: '8px',
          fontWeight: 'bold'
        }}
      >
        {document.fullscreenElement ? 'Exit Fullscreen' : 'Fullscreen'}
      </button>

      {/* Leaderboard Button */}
      <button
        onClick={showLeaderboardManually}
        style={{
          fontFamily: 'monospace',
          fontSize: '1.2rem',
          background: '#111',
          color: '#0f0',
          border: '3px solid #0f0',
          padding: '12px 24px',
          cursor: 'pointer',
          marginTop: 8,
          marginBottom: 8,
          touchAction: 'manipulation',
          boxShadow: '0 0 10px #0f0',
          borderRadius: '8px',
          fontWeight: 'bold'
        }}
      >
        🏆 Leaderboard
      </button>

      {/* Score Entry Modal */}
      {showScoreEntry && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#111',
            border: '3px solid #0f0',
            padding: '24px',
            borderRadius: '8px',
            textAlign: 'center',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3 style={{ color: '#0f0', fontFamily: 'monospace', marginBottom: '16px' }}>
              🎉 You Won! Time: {completionTime}s
            </h3>
            <p style={{ color: '#0f0', fontFamily: 'monospace', marginBottom: '16px' }}>
              Enter your name to save your time:
            </p>
            <input
              type="text"
              maxLength="20"
              placeholder="Your name"
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '16px',
                fontFamily: 'monospace',
                background: '#222',
                color: '#0f0',
                border: '2px solid #0f0',
                borderRadius: '4px'
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleScoreSubmit(e.target.value);
                }
              }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button
                onClick={() => handleScoreSubmit(document.querySelector('input').value)}
                style={{
                  fontFamily: 'monospace',
                  background: '#0f0',
                  color: '#000',
                  border: '2px solid #0f0',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  borderRadius: '4px'
                }}
              >
                Save Time
              </button>
              <button
                onClick={handleScoreCancel}
                style={{
                  fontFamily: 'monospace',
                  background: '#222',
                  color: '#0f0',
                  border: '2px solid #0f0',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  borderRadius: '4px'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#111',
            border: '3px solid #0f0',
            padding: '24px',
            borderRadius: '8px',
            textAlign: 'center',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ color: '#0f0', fontFamily: 'monospace', marginBottom: '16px' }}>
              🏆 Minesweeper Leaderboard
            </h3>
            <div style={{ marginBottom: '16px' }}>
              {getTopScore() > 0 && (
                <p style={{ color: '#0f0', fontFamily: 'monospace' }}>
                  Best Time: {getTopScore()}s
                </p>
              )}
            </div>
            <button
              onClick={handleLeaderboardClose}
              style={{
                fontFamily: 'monospace',
                background: '#222',
                color: '#0f0',
                border: '2px solid #0f0',
                padding: '8px 16px',
                cursor: 'pointer',
                borderRadius: '4px'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      {/* Explosion Animation */}
      <canvas
        ref={canvasRef}
        width={BOARD_SIZE * CELL_SIZE}
        height={BOARD_SIZE * CELL_SIZE}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: 10
        }}
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
}

export default Minesweeper; 