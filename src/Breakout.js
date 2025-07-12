import React, { useRef, useEffect, useState } from 'react';
import soundManager from './sounds';
import { Link } from 'react-router-dom';
import MobileControls from './MobileControls'; // (not used, but for consistency)
import useScoreboard from './useScoreboard';

const WIDTH = 600;
const HEIGHT = 400;
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 20;
const BALL_SIZE = 10;
const BRICK_ROWS = 5;
const BRICK_COLS = 10;
const BRICK_WIDTH = WIDTH / BRICK_COLS;
const BRICK_HEIGHT = 30;
const BRICK_PADDING = 2;

function Breakout() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const currentScoreRef = useRef(0);
  
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
  } = useScoreboard('Breakout');

  const gameRef = useRef({
    paddleX: WIDTH / 2 - PADDLE_WIDTH / 2,
    ballX: WIDTH / 2,
    ballY: HEIGHT - 50,
    ballVX: 4,
    ballVY: -4,
    bricks: [],
    keys: {}
  });

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize bricks
  const initializeBricks = () => {
    const bricks = [];
    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        bricks.push({
          x: col * BRICK_WIDTH + BRICK_PADDING,
          y: row * BRICK_HEIGHT + BRICK_PADDING + 50,
          width: BRICK_WIDTH - BRICK_PADDING * 2,
          height: BRICK_HEIGHT - BRICK_PADDING * 2,
          color: `hsl(${row * 60}, 70%, 50%)`,
          alive: true
        });
      }
    }
    gameRef.current.bricks = bricks;
  };

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      gameRef.current.keys[e.key.toLowerCase()] = true;
    };
    const handleKeyUp = (e) => {
      gameRef.current.keys[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Touch controls
  const handleTouchMove = (e) => {
    if (!running || gameOver) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    gameRef.current.paddleX = Math.max(0, Math.min(WIDTH - PADDLE_WIDTH, x - PADDLE_WIDTH / 2));
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

  // Game loop
  useEffect(() => {
    if (!running) return;
    
    let animationId;
    function draw() {
      const ctx = canvasRef.current.getContext('2d');
      
      // Clear canvas
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      
      // Draw paddle
      ctx.fillStyle = '#0f0';
      ctx.fillRect(gameRef.current.paddleX, HEIGHT - PADDLE_HEIGHT - 10, PADDLE_WIDTH, PADDLE_HEIGHT);
      
      // Draw ball
      ctx.fillStyle = '#ff0';
      ctx.beginPath();
      ctx.arc(gameRef.current.ballX, gameRef.current.ballY, BALL_SIZE, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw bricks
      gameRef.current.bricks.forEach(brick => {
        if (brick.alive) {
          ctx.fillStyle = brick.color;
          ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 1;
          ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
        }
      });
      
      // Draw score and lives
      ctx.font = '20px monospace';
      ctx.fillStyle = '#0f0';
      ctx.fillText(`Score: ${score}`, 10, 30);
      ctx.fillText(`Lives: ${lives}`, WIDTH - 100, 30);
      
      if (gameOver) {
        ctx.font = '32px monospace';
        ctx.fillStyle = '#f00';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2);
      }
    }
    
    function update() {
      // Paddle movement
      if (gameRef.current.keys['a'] || gameRef.current.keys['left']) {
        gameRef.current.paddleX = Math.max(0, gameRef.current.paddleX - 8);
      }
      if (gameRef.current.keys['d'] || gameRef.current.keys['right']) {
        gameRef.current.paddleX = Math.min(WIDTH - PADDLE_WIDTH, gameRef.current.paddleX + 8);
      }
      
      // Ball movement
      gameRef.current.ballX += gameRef.current.ballVX;
      gameRef.current.ballY += gameRef.current.ballVY;
      
      // Wall collision
      if (gameRef.current.ballX <= BALL_SIZE || gameRef.current.ballX >= WIDTH - BALL_SIZE) {
        gameRef.current.ballVX *= -1;
        soundManager.breakoutWall();
      }
      if (gameRef.current.ballY <= BALL_SIZE) {
        gameRef.current.ballVY *= -1;
        soundManager.breakoutWall();
      }
      
      // Paddle collision
      if (gameRef.current.ballY >= HEIGHT - PADDLE_HEIGHT - 10 - BALL_SIZE &&
          gameRef.current.ballY <= HEIGHT - PADDLE_HEIGHT - 10 + PADDLE_HEIGHT &&
          gameRef.current.ballX >= gameRef.current.paddleX &&
          gameRef.current.ballX <= gameRef.current.paddleX + PADDLE_WIDTH) {
        
        soundManager.breakoutPaddle();
        gameRef.current.ballVY *= -1;
        
        // Add some angle based on where ball hits paddle
        const hitPos = (gameRef.current.ballX - gameRef.current.paddleX) / PADDLE_WIDTH;
        gameRef.current.ballVX = (hitPos - 0.5) * 8;
      }
      
      // Bottom wall (lose life)
      if (gameRef.current.ballY >= HEIGHT) {
        soundManager.breakoutLoseLife();
        setLives(prev => prev - 1);
        if (lives <= 1) {
          setGameOver(true);
          setRunning(false);
          handleGameOver(currentScoreRef.current);
        } else {
          // Reset ball
          gameRef.current.ballX = WIDTH / 2;
          gameRef.current.ballY = HEIGHT - 50;
          gameRef.current.ballVX = 4;
          gameRef.current.ballVY = -4;
        }
      }
      
      // Brick collision
      gameRef.current.bricks.forEach(brick => {
        if (brick.alive &&
            gameRef.current.ballX >= brick.x &&
            gameRef.current.ballX <= brick.x + brick.width &&
            gameRef.current.ballY >= brick.y &&
            gameRef.current.ballY <= brick.y + brick.height) {
          
          soundManager.breakoutBrick();
          brick.alive = false;
          setScore(prev => {
            const newScore = prev + 10;
            currentScoreRef.current = newScore;
            return newScore;
          });
          gameRef.current.ballVY *= -1;
        }
      });
      
      // Check win
      const bricksLeft = gameRef.current.bricks.filter(brick => brick.alive).length;
      if (bricksLeft === 0) {
        soundManager.breakoutWin();
        setGameOver(true);
        setRunning(false);
        handleGameOver(currentScoreRef.current);
      }
    }
    
    function loop() {
      update();
      draw();
      if (!gameOver) animationId = requestAnimationFrame(loop);
    }
    loop();
    return () => cancelAnimationFrame(animationId);
  }, [running, gameOver, lives, score, handleGameOver]);

  function handleStart() {
    soundManager.buttonClick();
    initializeBricks();
    gameRef.current.paddleX = WIDTH / 2 - PADDLE_WIDTH / 2;
    gameRef.current.ballX = WIDTH / 2;
    gameRef.current.ballY = HEIGHT - 50;
    gameRef.current.ballVX = 4;
    gameRef.current.ballVY = -4;
    setScore(0);
    currentScoreRef.current = 0;
    setLives(3);
    setGameOver(false);
    setRunning(true);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2 style={{ fontFamily: 'monospace', color: '#00ff00', textShadow: '2px 2px #000' }}>Breakout</h2>
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
      <div style={{ width: '100%', maxWidth: 480, aspectRatio: '2', margin: '0 auto', marginBottom: 16 }}>
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          style={{
            width: '100%',
            height: 'auto',
            border: '4px solid #0f0',
            background: '#111',
            display: 'block',
            boxSizing: 'border-box',
            touchAction: 'manipulation'
          }}
          onTouchMove={handleTouchMove}
          onTouchStart={handleTouchMove}
        />
      </div>
      <div style={{ color: '#0f0', fontFamily: 'monospace', marginBottom: 8 }}>
        Controls: {isMobile ? 'Touch below paddle to move' : 'A/D or Arrow Keys'}
      </div>
      {/* Large touch area for paddle movement on mobile */}
      {isMobile && running && !gameOver && (
        <div
          style={{ width: '100%', maxWidth: 480, height: 80, margin: '0 auto', marginBottom: 16, background: 'rgba(0,255,0,0.08)', borderRadius: 12, touchAction: 'pan-x', zIndex: 10 }}
          onTouchMove={handleTouchMove}
          onTouchStart={handleTouchMove}
        />
      )}
      {(!running || gameOver) && (
        <button onClick={handleStart} style={{ fontFamily: 'monospace', fontSize: '1.2rem', background: '#222', color: '#0f0', border: '2px solid #0f0', padding: '8px 16px', cursor: 'pointer' }}>
          {score === 0 ? 'Start' : 'Restart'}
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
              Game Over! Score: {currentScoreRef.current}
            </h3>
            <p style={{ color: '#0f0', fontFamily: 'monospace', marginBottom: '16px' }}>
              Enter your name to save your score:
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
                Save Score
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
              🏆 Breakout Leaderboard
            </h3>
            <div style={{ marginBottom: '16px' }}>
              {getTopScore() > 0 && (
                <p style={{ color: '#0f0', fontFamily: 'monospace' }}>
                  Top Score: {getTopScore()}
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
    </div>
  );
}

export default Breakout; 