import React, { useState } from 'react';
import soundManager from './sounds';
import { Link } from 'react-router-dom';

const CHOICES = ['Rock', 'Paper', 'Scissors'];
const COLORS = { Rock: '#0ff', Paper: '#ff0', Scissors: '#f0f' };

function getResult(player, computer) {
  if (player === computer) return 'Draw!';
  if (
    (player === 'Rock' && computer === 'Scissors') ||
    (player === 'Paper' && computer === 'Rock') ||
    (player === 'Scissors' && computer === 'Paper')
  ) {
    return 'You Win!';
  }
  return 'You Lose!';
}

function RockPaperScissors() {
  const [playerChoice, setPlayerChoice] = useState(null);
  const [computerChoice, setComputerChoice] = useState(null);
  const [result, setResult] = useState(null);

  const handleChoice = (playerChoice) => {
    soundManager.rpsChoice();
    const choices = ['Rock', 'Paper', 'Scissors'];
    const computerChoice = choices[Math.floor(Math.random() * 3)];
    setPlayerChoice(playerChoice);
    setComputerChoice(computerChoice);
    const result = getResult(playerChoice, computerChoice);
    setResult(result);
    
    // Play win/lose sound
    if (result === 'You Win!') {
      setTimeout(() => soundManager.rpsWin(), 100);
    } else if (result === 'You Lose!') {
      setTimeout(() => soundManager.rpsLose(), 100);
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

  const resetGame = () => {
    soundManager.buttonClick();
    setPlayerChoice(null);
    setComputerChoice(null);
    setResult(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2 style={{ fontFamily: 'monospace', color: '#00ff00', textShadow: '2px 2px #000' }}>Rock Paper Scissors</h2>
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
      {!playerChoice ? (
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          {CHOICES.map((choice) => (
            <button
              key={choice}
              onClick={() => handleChoice(choice)}
              style={{
                fontFamily: 'monospace',
                fontSize: '1.5rem',
                color: COLORS[choice],
                background: '#111',
                border: '2px solid #0f0',
                padding: '12px 24px',
                cursor: 'pointer',
                textShadow: '2px 2px #000'
              }}
            >
              {choice}
            </button>
          ))}
        </div>
      ) : (
        <>
          <div style={{ color: COLORS[playerChoice], fontFamily: 'monospace', fontSize: '1.5rem', marginBottom: 8 }}>
            You: {playerChoice}
          </div>
          <div style={{ color: COLORS[computerChoice], fontFamily: 'monospace', fontSize: '1.5rem', marginBottom: 8 }}>
            Computer: {computerChoice}
          </div>
          <div style={{ color: '#0f0', fontFamily: 'monospace', fontSize: '1.5rem', marginBottom: 8 }}>
            {result}
          </div>
          <button onClick={resetGame} style={{ fontFamily: 'monospace', fontSize: '1.2rem', background: '#222', color: '#0f0', border: '2px solid #0f0', padding: '8px 16px', cursor: 'pointer' }}>
            Play Again
          </button>
        </>
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

export default RockPaperScissors; 