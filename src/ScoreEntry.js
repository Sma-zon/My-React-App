import React, { useState, useEffect } from 'react';
import soundManager from './sounds';

const ScoreEntry = ({ score, gameName, onSubmit, onCancel }) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Focus the input when component mounts
    const input = document.getElementById('username-input');
    if (input) {
      input.focus();
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const trimmedUsername = username.trim();
    
    if (!trimmedUsername) {
      setError('Please enter a username');
      return;
    }
    
    if (trimmedUsername.length > 20) {
      setError('Username must be 20 characters or less');
      return;
    }
    
    if (trimmedUsername.length < 2) {
      setError('Username must be at least 2 characters');
      return;
    }
    
    soundManager.buttonClick();
    onSubmit(trimmedUsername);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      soundManager.buttonClick();
      onCancel();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#111',
        border: '3px solid #0f0',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 0 20px #0f0'
      }}>
        <h3 style={{
          fontFamily: 'monospace',
          color: '#0f0',
          textAlign: 'center',
          marginBottom: '16px',
          textShadow: '2px 2px #000'
        }}>
          🏆 NEW HIGH SCORE! 🏆
        </h3>
        
        <div style={{
          color: '#0f0',
          fontFamily: 'monospace',
          textAlign: 'center',
          marginBottom: '20px',
          fontSize: '1.2rem'
        }}>
          Score: {score}
        </div>
        
        <div style={{
          color: '#0f0',
          fontFamily: 'monospace',
          textAlign: 'center',
          marginBottom: '20px',
          fontSize: '1rem'
        }}>
          Game: {gameName}
        </div>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              color: '#0f0',
              fontFamily: 'monospace',
              marginBottom: '8px',
              fontSize: '1rem'
            }}>
              Enter your username:
            </label>
            <input
              id="username-input"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
              }}
              onKeyDown={handleKeyDown}
              maxLength={20}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '1rem',
                fontFamily: 'monospace',
                background: '#222',
                color: '#0f0',
                border: '2px solid #0f0',
                borderRadius: '4px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              placeholder="Your username..."
            />
            {error && (
              <div style={{
                color: '#f00',
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                marginTop: '8px'
              }}>
                {error}
              </div>
            )}
          </div>
          
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center'
          }}>
            <button
              type="submit"
              style={{
                fontFamily: 'monospace',
                fontSize: '1rem',
                background: '#0f0',
                color: '#111',
                border: '2px solid #0f0',
                padding: '10px 20px',
                cursor: 'pointer',
                borderRadius: '4px',
                fontWeight: 'bold'
              }}
            >
              Save Score
            </button>
            <button
              type="button"
              onClick={() => {
                soundManager.buttonClick();
                onCancel();
              }}
              style={{
                fontFamily: 'monospace',
                fontSize: '1rem',
                background: '#222',
                color: '#0f0',
                border: '2px solid #0f0',
                padding: '10px 20px',
                cursor: 'pointer',
                borderRadius: '4px'
              }}
            >
              Cancel
            </button>
          </div>
        </form>
        
        <div style={{
          color: '#888',
          fontFamily: 'monospace',
          fontSize: '0.8rem',
          textAlign: 'center',
          marginTop: '16px'
        }}>
          Press ESC to cancel
        </div>
      </div>
    </div>
  );
};

export default ScoreEntry; 