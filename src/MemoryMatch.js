import React, { useState, useEffect } from 'react';
import soundManager from './sounds';
import { Link } from 'react-router-dom';

// Card symbols for the memory game
const CARD_SYMBOLS = ['🎮', '🎲', '🎯', '🎪', '🎨', '🎭', '🎪', '🎯', '🎲', '🎮', '🎨', '🎭'];

function MemoryMatch() {
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [moves, setMoves] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
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
  const initializeGame = () => {
    // Create pairs of cards
    const cardPairs = [...CARD_SYMBOLS, ...CARD_SYMBOLS];
    
    // Shuffle cards
    const shuffledCards = cardPairs
      .sort(() => Math.random() - 0.5)
      .map((symbol, index) => ({
        id: index,
        symbol: symbol,
        isFlipped: false,
        isMatched: false
      }));
    
    setCards(shuffledCards);
    setFlippedCards([]);
    setMatchedPairs([]);
    setMoves(0);
    setGameWon(false);
    setTimer(0);
    setIsRunning(true);
    soundManager.buttonClick();
  };

  // Handle card click
  const handleCardClick = (cardId) => {
    if (!isRunning || gameWon) return;
    
    const card = cards.find(c => c.id === cardId);
    if (!card || card.isFlipped || card.isMatched || flippedCards.length >= 2) return;
    
    soundManager.memoryFlip();
    
    // Flip the card
    const newCards = cards.map(c => 
      c.id === cardId ? { ...c, isFlipped: true } : c
    );
    setCards(newCards);
    
    const newFlippedCards = [...flippedCards, cardId];
    setFlippedCards(newFlippedCards);
    
    // Check for match when two cards are flipped
    if (newFlippedCards.length === 2) {
      const [firstId, secondId] = newFlippedCards;
      const firstCard = newCards.find(c => c.id === firstId);
      const secondCard = newCards.find(c => c.id === secondId);
      
      if (firstCard.symbol === secondCard.symbol) {
        // Match found
        soundManager.memoryMatch();
        setMatchedPairs(prev => [...prev, firstId, secondId]);
        
        // Mark cards as matched
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            c.id === firstId || c.id === secondId 
              ? { ...c, isMatched: true } 
              : c
          ));
        }, 500);
        
        setFlippedCards([]);
        setMoves(prev => prev + 1);
        
        // Check if game is won
        if (matchedPairs.length + 2 === cards.length) {
          setTimeout(() => {
            setGameWon(true);
            setIsRunning(false);
            soundManager.memoryMatch();
          }, 1000);
        }
      } else {
        // No match
        soundManager.memoryMismatch();
        setMoves(prev => prev + 1);
        
        // Flip cards back after delay
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            c.id === firstId || c.id === secondId 
              ? { ...c, isFlipped: false } 
              : c
          ));
          setFlippedCards([]);
        }, 1000);
      }
    }
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
      <h2 style={{ fontFamily: 'monospace', color: '#00ff00', textShadow: '2px 2px #000' }}>Memory Match</h2>
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
      
      {/* Game Stats */}
      <div style={{ 
        display: 'flex', 
        gap: 20, 
        marginBottom: 16,
        color: '#0f0',
        fontFamily: 'monospace',
        fontSize: '1rem'
      }}>
        <div>Moves: {moves}</div>
        <div>Time: {formatTime(timer)}</div>
        <div>Pairs: {matchedPairs.length / 2}/12</div>
      </div>

      {/* Memory Grid */}
      <div style={{ width: '100%', maxWidth: 400, margin: '0 auto', marginBottom: 16 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: 10,
            width: '100%',
            aspectRatio: cols + '/' + rows,
          }}
        >
          {cards.map((card, idx) => (
            <button
              key={idx}
              onClick={() => handleCardClick(idx)}
              disabled={card.matched || card.flipped || disabled}
              style={{
                width: '100%',
                aspectRatio: '1',
                fontSize: isMobile ? '2.2rem' : '1.5rem',
                background: card.flipped || card.matched ? '#0f0' : '#222',
                color: card.flipped || card.matched ? '#111' : '#0f0',
                border: '3px solid #0f0',
                borderRadius: 12,
                cursor: card.matched ? 'default' : 'pointer',
                fontFamily: 'monospace',
                touchAction: 'manipulation',
                boxShadow: card.flipped ? '0 0 8px #0f0' : undefined,
                userSelect: 'none',
                outline: 'none',
                transition: 'background 0.2s, color 0.2s',
              }}
            >
              {card.flipped || card.matched ? card.value : '?'}
            </button>
          ))}
        </div>
      </div>

      {/* Control Buttons */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <button
          onClick={initializeGame}
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
          🎉 Memory Master! 🎉
          <br />
          Completed in {moves} moves and {formatTime(timer)}
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

export default MemoryMatch; 