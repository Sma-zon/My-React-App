import React, { useState, useEffect, useRef } from 'react';
import soundManager from './sounds';

// Sample word search puzzles
const WORD_SEARCH_PUZZLES = [
  {
    grid: [
      ['G', 'A', 'M', 'E', 'S', 'P', 'L', 'A', 'Y'],
      ['A', 'R', 'C', 'A', 'D', 'E', 'F', 'U', 'N'],
      ['M', 'E', 'M', 'O', 'R', 'Y', 'G', 'O', 'O'],
      ['E', 'T', 'R', 'I', 'S', 'H', 'I', 'T', 'D'],
      ['S', 'I', 'S', 'N', 'A', 'K', 'E', 'A', 'Y'],
      ['T', 'C', 'O', 'I', 'N', 'S', 'S', 'C', 'S'],
      ['E', 'H', 'R', 'E', 'T', 'R', 'O', 'O', 'E'],
      ['R', 'E', 'S', 'C', 'O', 'R', 'E', 'S', 'R'],
      ['S', 'T', 'A', 'R', 'T', 'G', 'A', 'M', 'E']
    ],
    words: ['GAMES', 'ARCADE', 'MEMORY', 'TETRIS', 'SNAKE', 'COINS', 'RETRO', 'SCORES', 'START']
  },
  {
    grid: [
      ['P', 'U', 'Z', 'Z', 'L', 'E', 'S', 'O', 'L'],
      ['A', 'C', 'T', 'I', 'O', 'N', 'A', 'D', 'V'],
      ['C', 'H', 'A', 'L', 'L', 'E', 'N', 'G', 'E'],
      ['M', 'A', 'N', 'D', 'E', 'R', 'O', 'I', 'N'],
        ['A', 'T', 'E', 'R', 'S', 'T', 'A', 'R', 'T'],
      ['N', 'I', 'N', 'G', 'A', 'M', 'E', 'S', 'E'],
      ['S', 'T', 'A', 'T', 'E', 'G', 'Y', 'S', 'T'],
      ['E', 'R', 'T', 'I', 'M', 'E', 'R', 'S', 'E'],
      ['S', 'T', 'A', 'R', 'T', 'G', 'A', 'M', 'E']
    ],
    words: ['PUZZLES', 'ACTION', 'CHALLENGE', 'MANDERIN', 'START', 'GAMES', 'STRATEGY', 'TIMERS']
  }
];

function WordSearch() {
  const [currentPuzzle, setCurrentPuzzle] = useState(0);
  const [grid, setGrid] = useState([]);
  const [words, setWords] = useState([]);
  const [foundWords, setFoundWords] = useState([]);
  const [selectedCells, setSelectedCells] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const gridRef = useRef(null);

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
  const initializeGame = (puzzleIndex = 0) => {
    const puzzle = WORD_SEARCH_PUZZLES[puzzleIndex];
    setGrid(puzzle.grid);
    setWords(puzzle.words);
    setFoundWords([]);
    setSelectedCells([]);
    setIsSelecting(false);
    setGameWon(false);
    setTimer(0);
    setIsRunning(true);
    soundManager.buttonClick();
  };

  // Get cell coordinates from event
  const getCellCoordinates = (event) => {
    const rect = gridRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const cellSize = rect.width / 9;
    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);
    return { row, col };
  };

  // Handle mouse/touch down
  const handlePointerDown = (event) => {
    if (!isRunning || gameWon) return;
    
    const { row, col } = getCellCoordinates(event);
    if (row >= 0 && row < 9 && col >= 0 && col < 9) {
      setIsSelecting(true);
      setSelectedCells([{ row, col }]);
      soundManager.wordSearchSelect();
    }
  };

  // Handle mouse/touch move
  const handlePointerMove = (event) => {
    if (!isSelecting || !isRunning || gameWon) return;
    
    const { row, col } = getCellCoordinates(event);
    if (row >= 0 && row < 9 && col >= 0 && col < 9) {
      const lastCell = selectedCells[selectedCells.length - 1];
      if (lastCell.row !== row || lastCell.col !== col) {
        setSelectedCells(prev => [...prev, { row, col }]);
      }
    }
  };

  // Handle mouse/touch up
  const handlePointerUp = () => {
    if (!isSelecting || !isRunning || gameWon) return;
    
    setIsSelecting(false);
    
    if (selectedCells.length < 2) {
      setSelectedCells([]);
      return;
    }
    
    // Check if selected cells form a word
    const word = selectedCells.map(cell => grid[cell.row][cell.col]).join('');
    const reversedWord = word.split('').reverse().join('');
    
    if (words.includes(word) && !foundWords.includes(word)) {
      setFoundWords(prev => [...prev, word]);
      soundManager.wordSearchFound();
      
      // Check if all words are found
      if (foundWords.length + 1 === words.length) {
        setGameWon(true);
        setIsRunning(false);
        soundManager.wordSearchFound();
      }
    } else if (words.includes(reversedWord) && !foundWords.includes(reversedWord)) {
      setFoundWords(prev => [...prev, reversedWord]);
      soundManager.wordSearchFound();
      
      // Check if all words are found
      if (foundWords.length + 1 === words.length) {
        setGameWon(true);
        setIsRunning(false);
        soundManager.wordSearchFound();
      }
    }
    
    setSelectedCells([]);
  };

  // Check if cell is in selected path
  const isCellSelected = (row, col) => {
    return selectedCells.some(cell => cell.row === row && cell.col === col);
  };

  // Check if cell is in found word
  const isCellFound = (row, col) => {
    return foundWords.some(word => {
      // Check if this cell is part of any found word
      for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
          // Check horizontal
          if (j + word.length <= 9) {
            const horizontalWord = grid[i].slice(j, j + word.length).join('');
            if (horizontalWord === word && i === row && col >= j && col < j + word.length) {
              return true;
            }
          }
          // Check vertical
          if (i + word.length <= 9) {
            const verticalWord = Array.from({ length: word.length }, (_, k) => grid[i + k][j]).join('');
            if (verticalWord === word && j === col && row >= i && row < i + word.length) {
              return true;
            }
          }
          // Check diagonal
          if (i + word.length <= 9 && j + word.length <= 9) {
            const diagonalWord = Array.from({ length: word.length }, (_, k) => grid[i + k][j + k]).join('');
            if (diagonalWord === word && row >= i && row < i + word.length && col >= j && col < j + word.length && row - i === col - j) {
              return true;
            }
          }
        }
      }
      return false;
    });
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
      <h2 style={{ fontFamily: 'monospace', color: '#00ff00', textShadow: '2px 2px #000' }}>Word Search</h2>
      
      {/* Game Stats */}
      <div style={{ 
        display: 'flex', 
        gap: 20, 
        marginBottom: 16,
        color: '#0f0',
        fontFamily: 'monospace',
        fontSize: '1rem'
      }}>
        <div>Time: {formatTime(timer)}</div>
        <div>Found: {foundWords.length}/{words.length}</div>
        <div>Puzzle: {currentPuzzle + 1}/{WORD_SEARCH_PUZZLES.length}</div>
      </div>

      {/* Word Grid */}
      <div
        ref={gridRef}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(9, 1fr)',
          gap: 2,
          background: '#0f0',
          padding: 4,
          marginBottom: 16,
          cursor: 'crosshair',
          userSelect: 'none',
          touchAction: 'none'
        }}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      >
        {grid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              style={{
                width: isMobile ? 35 : 45,
                height: isMobile ? 35 : 45,
                background: isCellFound(rowIndex, colIndex)
                  ? '#0f0'
                  : isCellSelected(rowIndex, colIndex)
                    ? '#333'
                    : '#111',
                color: isCellFound(rowIndex, colIndex) ? '#000' : '#0f0',
                border: '1px solid #0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'monospace',
                fontSize: isMobile ? '0.8rem' : '1rem',
                fontWeight: 'bold',
                cursor: 'crosshair'
              }}
            >
              {cell}
            </div>
          ))
        )}
      </div>

      {/* Word List */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: 8, 
        marginBottom: 16,
        maxWidth: '100%'
      }}>
        {words.map(word => (
          <div
            key={word}
            style={{
              padding: '4px 8px',
              background: foundWords.includes(word) ? '#0f0' : '#111',
              color: foundWords.includes(word) ? '#000' : '#0f0',
              border: '1px solid #0f0',
              fontFamily: 'monospace',
              fontSize: isMobile ? '0.8rem' : '1rem',
              textAlign: 'center',
              textDecoration: foundWords.includes(word) ? 'line-through' : 'none'
            }}
          >
            {word}
          </div>
        ))}
      </div>

      {/* Control Buttons */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <button
          onClick={() => initializeGame(currentPuzzle)}
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
          onClick={() => {
            const nextPuzzle = (currentPuzzle + 1) % WORD_SEARCH_PUZZLES.length;
            setCurrentPuzzle(nextPuzzle);
            initializeGame(nextPuzzle);
          }}
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
          Next Puzzle
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
          🎉 Word Master! 🎉
          <br />
          Completed in {formatTime(timer)}
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

export default WordSearch; 