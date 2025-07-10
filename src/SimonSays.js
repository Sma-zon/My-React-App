import React, { useState, useEffect, useRef, useCallback } from 'react';
import soundManager from './sounds';
import { Link } from 'react-router-dom';

const COLORS = [
  { name: 'green', code: '#0f0' },
  { name: 'red', code: '#f00' },
  { name: 'yellow', code: '#ff0' },
  { name: 'blue', code: '#0ff' }
];

function getRandomColorIdx() {
  return Math.floor(Math.random() * 4);
}

function SimonSays() {
  const [sequence, setSequence] = useState([getRandomColorIdx()]);
  const [userStep, setUserStep] = useState(0);
  const [isUserTurn, setIsUserTurn] = useState(false);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState('Watch the sequence!');
  const [activeIdx, setActiveIdx] = useState(null);
  const timeoutRef = useRef();

  // Show sequence
  useEffect(() => {
    if (!isUserTurn) {
      let i = 0;
      setMessage('Watch the sequence!');
      
      function showStep() {
        setActiveIdx(sequence[i]);
        timeoutRef.current = setTimeout(() => {
          setActiveIdx(null);
          i++;
          if (i < sequence.length) {
            timeoutRef.current = setTimeout(showStep, 400);
          } else {
            setIsUserTurn(true);
            setMessage('Your turn!');
            setUserStep(0);
          }
        }, 400);
      }
      
      timeoutRef.current = setTimeout(showStep, 600);
      
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }
  }, [sequence, isUserTurn]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleColor = useCallback((idx) => {
    if (!isUserTurn) return;
    
    soundManager.simonButton();
    
    if (idx === sequence[userStep]) {
      setActiveIdx(idx);
      setTimeout(() => setActiveIdx(null), 200);
      
      if (userStep + 1 === sequence.length) {
        setScore((s) => s + 1);
        setIsUserTurn(false);
        setSequence((seq) => [...seq, getRandomColorIdx()]);
        setMessage('Good! Next round...');
      } else {
        setUserStep(userStep + 1);
      }
    } else {
      soundManager.simonGameOver();
      setMessage('Wrong! Game Over.');
      setIsUserTurn(false);
    }
  }, [isUserTurn, sequence, userStep]);

  function handleRestart() {
    soundManager.buttonClick();
    
    // Clear any existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setSequence([getRandomColorIdx()]);
    setUserStep(0);
    setIsUserTurn(false);
    setScore(0);
    setMessage('Watch the sequence!');
    setActiveIdx(null);
  }

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2 style={{ fontFamily: 'monospace', color: '#00ff00', textShadow: '2px 2px #000' }}>Simon Says</h2>
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 80px)', gridTemplateRows: 'repeat(2, 80px)', gap: 12, marginBottom: 16 }}>
        {COLORS.map((c, idx) => (
          <button
            key={c.name}
            onClick={() => handleColor(idx)}
            style={{
              width: 80,
              height: 80,
              background: activeIdx === idx ? '#fff' : c.code,
              border: '4px solid #111',
              borderRadius: 12,
              boxShadow: '2px 2px 8px #000',
              opacity: isUserTurn || activeIdx === idx ? 1 : 0.7,
              cursor: isUserTurn ? 'pointer' : 'default',
              transition: 'background 0.1s, opacity 0.1s'
            }}
            disabled={!isUserTurn}
          />
        ))}
      </div>
      <div style={{ color: '#0f0', fontFamily: 'monospace', marginBottom: 8 }}>{message}</div>
      <div style={{ color: '#0f0', fontFamily: 'monospace', marginBottom: 8 }}>Score: {score}</div>
      {message.includes('Game Over') && (
        <button onClick={handleRestart} style={{ fontFamily: 'monospace', fontSize: '1.2rem', background: '#222', color: '#0f0', border: '2px solid #0f0', padding: '8px 16px', cursor: 'pointer' }}>
          Restart
        </button>
      )}
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

export default SimonSays; 