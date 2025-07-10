import React, { useState } from 'react';

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

  function handleChoice(choice) {
    const comp = CHOICES[Math.floor(Math.random() * 3)];
    setPlayerChoice(choice);
    setComputerChoice(comp);
    setResult(getResult(choice, comp));
  }

  function handleRestart() {
    setPlayerChoice(null);
    setComputerChoice(null);
    setResult(null);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2 style={{ fontFamily: 'monospace', color: '#00ff00', textShadow: '2px 2px #000' }}>Rock Paper Scissors</h2>
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
          <button onClick={handleRestart} style={{ fontFamily: 'monospace', fontSize: '1.2rem', background: '#222', color: '#0f0', border: '2px solid #0f0', padding: '8px 16px', cursor: 'pointer' }}>
            Play Again
          </button>
        </>
      )}
    </div>
  );
}

export default RockPaperScissors; 