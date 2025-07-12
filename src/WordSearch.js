import React, { useState, useEffect, useCallback } from 'react';
import soundManager from './sounds';

// Word lists for different difficulties
const WORD_LISTS = {
  easy: [
    'CAT', 'DOG', 'BIRD', 'FISH', 'TREE', 'BOOK', 'HOUSE', 'CAR', 'SUN', 'MOON',
    'STAR', 'CAKE', 'BALL', 'GAME', 'FUN', 'RUN', 'JUMP', 'PLAY', 'EAT', 'SLEEP'
  ],
  medium: [
    'COMPUTER', 'ELEPHANT', 'BUTTERFLY', 'MOUNTAIN', 'OCEAN', 'FOREST', 'LIBRARY',
    'HOSPITAL', 'UNIVERSITY', 'RESTAURANT', 'AEROPLANE', 'TELEPHONE', 'TELEVISION',
    'BASKETBALL', 'FOOTBALL', 'BASEBALL', 'SWIMMING', 'READING', 'WRITING', 'DANCING'
  ],
  hard: [
    'PHOTOGRAPHY', 'ASTRONOMY', 'ARCHAEOLOGY', 'PHILOSOPHY', 'MATHEMATICS',
    'ENGINEERING', 'ARCHITECTURE', 'PSYCHOLOGY', 'BIOLOGY', 'CHEMISTRY',
    'PHYSICS', 'LITERATURE', 'HISTORY', 'GEOGRAPHY', 'ECONOMICS',
    'POLITICS', 'SOCIOLOGY', 'ANTHROPOLOGY', 'LINGUISTICS', 'THEOLOGY'
  ]
};

// Grid sizes for different difficulties
const GRID_SIZES = {
  easy: 12,
  medium: 16,
  hard: 20
};

// Directions for word placement
const DIRECTIONS = [
  { dx: 1, dy: 0, name: 'horizontal' },
  { dx: 0, dy: 1, name: 'vertical' },
  { dx: 1, dy: 1, name: 'diagonal down-right' },
  { dx: 1, dy: -1, name: 'diagonal up-right' },
  { dx: -1, dy: 0, name: 'horizontal backwards' },
  { dx: 0, dy: -1, name: 'vertical backwards' },
  { dx: -1, dy: -1, name: 'diagonal up-left' },
  { dx: -1, dy: 1, name: 'diagonal down-left' }
];

function WordSearch() {
  const [difficulty, setDifficulty] = useState('easy');
  const [grid, setGrid] = useState([]);
  const [words, setWords] = useState([]);
  const [foundWords, setFoundWords] = useState([]);
  const [selectedCells, setSelectedCells] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [startCell, setStartCell] = useState(null);
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

  // Generate random letters
  const generateRandomLetter = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    return letters[Math.floor(Math.random() * letters.length)];
  };

  // Check if word can be placed
  const canPlaceWord = (grid, word, startX, startY, direction) => {
    const { dx, dy } = direction;
    const length = word.length;
    
    for (let i = 0; i < length; i++) {
      const x = startX + i * dx;
      const y = startY + i * dy;
      
      if (x < 0 || x >= grid[0].length || y < 0 || y >= grid.length) {
        return false;
      }
      
      if (grid[y][x] !== '' && grid[y][x] !== word[i]) {
        return false;
      }
    }
    
    return true;
  };

  // Place word on grid
  const placeWord = (grid, word, startX, startY, direction) => {
    const { dx, dy } = direction;
    const newGrid = grid.map(row => [...row]);
    
    for (let i = 0; i < word.length; i++) {
      const x = startX + i * dx;
      const y = startY + i * dy;
      newGrid[y][x] = word[i];
    }
    
    return newGrid;
  };

  // Generate word search grid
  const generateGrid = useCallback((difficulty) => {
    const size = GRID_SIZES[difficulty];
    const wordList = WORD_LISTS[difficulty];
    const numWords = Math.min(8, wordList.length); // Use 8 words per game
    
    // Select random words
    const selectedWords = [];
    const shuffledWords = [...wordList].sort(() => Math.random() - 0.5);
    for (let i = 0; i < numWords; i++) {
      selectedWords.push(shuffledWords[i]);
    }
    
    // Initialize empty grid
    let grid = Array(size).fill().map(() => Array(size).fill(''));
    
    // Place words
    const placedWords = [];
    for (const word of selectedWords) {
      let placed = false;
      let attempts = 0;
      const maxAttempts = 100;
      
      while (!placed && attempts < maxAttempts) {
        const direction = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
        const startX = Math.floor(Math.random() * size);
        const startY = Math.floor(Math.random() * size);
        
        if (canPlaceWord(grid, word, startX, startY, direction)) {
          grid = placeWord(grid, word, startX, startY, direction);
          placedWords.push({
            word,
            startX,
            startY,
            direction,
            found: false
          });
          placed = true;
        }
        attempts++;
      }
    }
    
    // Fill remaining cells with random letters
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (grid[y][x] === '') {
          grid[y][x] = generateRandomLetter();
        }
      }
    }
    
    return { grid, words: placedWords };
  }, []);

  // Initialize game
  const initializeGame = (newDifficulty = difficulty) => {
    const { grid: newGrid, words: newWords } = generateGrid(newDifficulty);
    setGrid(newGrid);
    setWords(newWords);
    setFoundWords([]);
    setSelectedCells([]);
    setIsSelecting(false);
    setStartCell(null);
    setGameWon(false);
    setTimer(0);
    setIsRunning(true);
    soundManager.buttonClick();
  };

  // Check if selected cells form a word
  const checkWord = useCallback((cells) => {
    if (cells.length < 3) return; // Minimum word length
    
    const selectedWord = cells.map(cell => grid[cell.y][cell.x]).join('');
    
    for (const wordInfo of words) {
      if (wordInfo.word === selectedWord && !wordInfo.found) {
        // Mark word as found
        const updatedWords = words.map(w => 
          w.word === selectedWord ? { ...w, found: true } : w
        );
        setWords(updatedWords);
        setFoundWords(prev => [...prev, selectedWord]);
        soundManager.wordSearchFound();
        
        // Check if all words are found
        if (updatedWords.every(w => w.found)) {
          setGameWon(true);
          setIsRunning(false);
          soundManager.sudokuComplete(); // Reuse completion sound
        }
        return;
      }
    }
  }, [grid, words]);

  // Handle cell selection
  const handleCellClick = (x, y) => {
    if (gameWon) return;
    
    if (!isSelecting) {
      setStartCell({ x, y });
      setIsSelecting(true);
      setSelectedCells([{ x, y }]);
      soundManager.wordSearchSelect();
    } else {
      // End selection
      setIsSelecting(false);
      checkWord(selectedCells);
      setSelectedCells([]);
      setStartCell(null);
    }
  };

  // Handle cell hover (for desktop)
  const handleCellHover = (x, y) => {
    if (!isSelecting || !startCell) return;
    
    const cells = [];
    const dx = x - startCell.x;
    const dy = y - startCell.y;
    
    if (dx === 0 || dy === 0 || Math.abs(dx) === Math.abs(dy)) {
      const steps = Math.max(Math.abs(dx), Math.abs(dy)) + 1;
      const stepX = dx / (steps - 1);
      const stepY = dy / (steps - 1);
      
      for (let i = 0; i < steps; i++) {
        const cellX = startCell.x + i * stepX;
        const cellY = startCell.y + i * stepY;
        cells.push({ x: cellX, y: cellY });
      }
      
      setSelectedCells(cells);
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
      <h2 style={{ fontFamily: 'monospace', color: '#00ff00', textShadow: '2px 2px #000' }}>Word Search</h2>
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

      {/* Timer and Progress */}
      <div style={{ color: '#0f0', fontFamily: 'monospace', marginBottom: 16, textAlign: 'center' }}>
        <div>Time: {formatTime(timer)}</div>
        <div>Found: {foundWords.length} / {words.length}</div>
      </div>

      {/* Word List */}
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 8, 
        marginBottom: 16,
        maxWidth: '600px',
        justifyContent: 'center'
      }}>
        {words.map((wordInfo, index) => (
          <span
            key={index}
            style={{
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              color: wordInfo.found ? '#888' : '#0f0',
              textDecoration: wordInfo.found ? 'line-through' : 'none',
              padding: '4px 8px',
              border: '1px solid #0f0',
              borderRadius: '4px'
            }}
          >
            {wordInfo.word}
          </span>
        ))}
      </div>

      {/* Word Search Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: `repeat(${grid[0]?.length || 12}, 1fr)`, 
        gap: 1, 
        background: '#0f0', 
        padding: 4,
        marginBottom: 16,
        maxWidth: '100%',
        overflow: 'auto'
      }}>
        {grid.map((row, rowIndex) => 
          row.map((cell, colIndex) => {
            const isSelected = selectedCells.some(c => c.x === colIndex && c.y === rowIndex);
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                onClick={() => handleCellClick(colIndex, rowIndex)}
                onMouseEnter={() => handleCellHover(colIndex, rowIndex)}
                style={{
                  width: isMobile ? 25 : 35,
                  height: isMobile ? 25 : 35,
                  background: isSelected ? '#0f0' : '#111',
                  color: isSelected ? '#000' : '#0f0',
                  border: '1px solid #0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'monospace',
                  fontSize: isMobile ? '0.7rem' : '0.9rem',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  userSelect: 'none'
                }}
              >
                {cell}
              </div>
            );
          })
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

      {/* Win Message */}
      {gameWon && (
        <div style={{ 
          color: '#0f0', 
          fontFamily: 'monospace', 
          fontSize: '1.5rem', 
          marginBottom: 16,
          textAlign: 'center'
        }}>
          🎉 Congratulations! You found all the words! 🎉
        </div>
      )}

      {/* Instructions */}
      <div style={{ color: '#0f0', fontFamily: 'monospace', marginBottom: 8, textAlign: 'center', maxWidth: '600px' }}>
        {isMobile ? 
          'Tap cells to select words. Tap again to confirm selection.' :
          'Click and drag to select words. Words can be horizontal, vertical, or diagonal.'
        }
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
          marginTop: 16,
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