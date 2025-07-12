import React, { useRef, useEffect, useState } from 'react';
import soundManager from './sounds';
import useScoreboard from './useScoreboard';
import ScoreEntry from './ScoreEntry';
import Leaderboard from './Leaderboard';

const WIDTH = 600;
const HEIGHT = 400;
const BIRD_SIZE = 20;
const PIPE_WIDTH = 60;
const PIPE_GAP = 150;
const GRAVITY = 0.5;
const JUMP_FORCE = -8;

function FlappyBird() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const gameRef = useRef({
    bird: { x: 100, y: HEIGHT / 2, velocity: 0 },
    pipes: [],
    keys: {},
    lastTime: 0,
    frameCount: 0
  });
  
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
  } = useScoreboard('Flappy Bird');

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      gameRef.current.keys[e.key.toLowerCase()] = true;
      
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') {
        if (!running) {
          handleStart();
        } else {
          handleJump();
        }
      }
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
  }, [running]);

  // Handle jump
  const handleJump = () => {
    if (!running || gameOver) return;
    gameRef.current.bird.velocity = JUMP_FORCE;
    soundManager.flappyJump();
  };

  // Touch controls
  const handleTouch = () => {
    if (!running) {
      handleStart();
    } else {
      handleJump();
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

  // Initialize pipes
  const initializePipes = () => {
    const pipes = [];
    for (let i = 0; i < 3; i++) {
      const x = WIDTH + i * 300;
      const gapY = Math.random() * (HEIGHT - PIPE_GAP - 100) + 50;
      pipes.push({
        x: x,
        topHeight: gapY,
        bottomY: gapY + PIPE_GAP,
        passed: false
      });
    }
    gameRef.current.pipes = pipes;
  };



  // Game loop
  useEffect(() => {
    if (!running) return;
    
    let animationId;
    function draw() {
      const ctx = canvasRef.current.getContext('2d');
      
      // Clear canvas
      ctx.fillStyle = '#87CEEB';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      
      // Draw ground
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(0, HEIGHT - 20, WIDTH, 20);
      
      // Draw bird with enhanced visuals
      const bird = gameRef.current.bird;
      
      // Bird body
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(bird.x, bird.y, BIRD_SIZE / 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Bird shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.arc(bird.x + 2, bird.y + 2, BIRD_SIZE / 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Bird eye
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(bird.x + 5, bird.y - 3, 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Bird wing with animation
      ctx.fillStyle = '#FFA500';
      ctx.beginPath();
      const wingOffset = Math.sin(gameRef.current.frameCount * 0.2) * 2;
      ctx.arc(bird.x - 5, bird.y + wingOffset, 8, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw pipes
      gameRef.current.pipes.forEach(pipe => {
        // Top pipe
        ctx.fillStyle = '#228B22';
        ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
        
        // Bottom pipe
        ctx.fillRect(pipe.x, pipe.bottomY, PIPE_WIDTH, HEIGHT - pipe.bottomY);
        
        // Pipe caps
        ctx.fillStyle = '#006400';
        ctx.fillRect(pipe.x - 5, pipe.topHeight - 20, PIPE_WIDTH + 10, 20);
        ctx.fillRect(pipe.x - 5, pipe.bottomY, PIPE_WIDTH + 10, 20);
      });
      
      // Draw score
      ctx.font = '24px monospace';
      ctx.fillStyle = '#0f0';
      ctx.textAlign = 'center';
      ctx.fillText(`Score: ${score}`, WIDTH / 2, 30);
      ctx.fillText(`High Score: ${getTopScore()}`, WIDTH / 2, 60);
      
      if (gameOver) {
        ctx.font = '32px monospace';
        ctx.fillStyle = '#f00';
        ctx.fillText('Game Over!', WIDTH / 2, HEIGHT / 2);
        ctx.font = '20px monospace';
        ctx.fillStyle = '#0f0';
        ctx.fillText('Press SPACE or tap to restart', WIDTH / 2, HEIGHT / 2 + 40);
      }
    }
    
    function update() {
      const bird = gameRef.current.bird;
      
      // Update bird physics
      bird.velocity += GRAVITY;
      bird.y += bird.velocity;
      
      // Check boundaries
      if (bird.y < BIRD_SIZE / 2) {
        bird.y = BIRD_SIZE / 2;
        bird.velocity = 0;
      }
      if (bird.y > HEIGHT - BIRD_SIZE / 2 - 20) {
        bird.y = HEIGHT - BIRD_SIZE / 2 - 20;
        bird.velocity = 0;
        if (!gameOver) {
          setGameOver(true);
          setRunning(false);
          soundManager.flappyDeath();
          handleGameOver(score);
          return;
        }
      }
      
      // Update pipes with optimized collision detection
      const pipes = gameRef.current.pipes;
      for (let i = pipes.length - 1; i >= 0; i--) {
        const pipe = pipes[i];
        pipe.x -= 2;
        
        // Check if bird passed pipe
        if (!pipe.passed && pipe.x + PIPE_WIDTH < bird.x) {
          pipe.passed = true;
          setScore(prev => prev + 1);
          soundManager.flappyScore();
        }
        
        // Check collision (optimized)
        if (bird.x + BIRD_SIZE / 2 > pipe.x && 
            bird.x - BIRD_SIZE / 2 < pipe.x + PIPE_WIDTH &&
            (bird.y - BIRD_SIZE / 2 < pipe.topHeight || 
             bird.y + BIRD_SIZE / 2 > pipe.bottomY)) {
          if (!gameOver) {
            setGameOver(true);
            setRunning(false);
            soundManager.flappyDeath();
            handleGameOver(score);
            return;
          }
        }
        
        // Remove off-screen pipes
        if (pipe.x < -PIPE_WIDTH) {
          pipes.splice(i, 1);
        }
      }
      
      // Add new pipes if needed
      if (pipes.length < 3) {
        const lastPipe = pipes[pipes.length - 1];
        const newX = lastPipe ? lastPipe.x + 300 : WIDTH + 300;
        const gapY = Math.random() * (HEIGHT - PIPE_GAP - 100) + 50;
        pipes.push({
          x: newX,
          topHeight: gapY,
          bottomY: gapY + PIPE_GAP,
          passed: false
        });
      }
    }
    
    function loop(currentTime) {
      // Frame rate limiting for consistent gameplay
      if (currentTime - gameRef.current.lastTime >= 16) { // ~60 FPS
        update();
        draw();
        gameRef.current.lastTime = currentTime;
        gameRef.current.frameCount++;
      }
      
      if (!gameOver) animationId = requestAnimationFrame(loop);
    }
    loop();
    return () => cancelAnimationFrame(animationId);
  }, [running, gameOver, score, highScore, getTopScore, handleGameOver]);

  function handleStart() {
    soundManager.buttonClick();
    gameRef.current.bird = { x: 100, y: HEIGHT / 2, velocity: 0 };
    initializePipes();
    setScore(0);
    setGameOver(false);
    setRunning(true);
    
    // Update high score
    if (score > highScore) {
      setHighScore(score);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2 style={{ fontFamily: 'monospace', color: '#00ff00', textShadow: '2px 2px #000' }}>Flappy Bird</h2>
      <a 
        href="/"
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
      </a>
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        style={{ border: '4px solid #0f0', background: '#111', marginBottom: 16 }}
        onClick={handleTouch}
      />
      <div style={{ color: '#0f0', fontFamily: 'monospace', marginBottom: 8 }}>
        Controls: {isMobile ? 'Tap to jump' : 'SPACE or Arrow Up to jump'}
      </div>
      
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        {(!running || gameOver) && (
          <button onClick={handleStart} style={{ fontFamily: 'monospace', fontSize: '1.2rem', background: '#222', color: '#0f0', border: '2px solid #0f0', padding: '8px 16px', cursor: 'pointer' }}>
            {score === 0 ? 'Start' : 'Restart'}
          </button>
        )}
        <button
          onClick={showLeaderboardManually}
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
          Leaderboard
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
      
      {/* Score Entry Modal */}
      {showScoreEntry && (
        <ScoreEntry
          score={score}
          gameName="Flappy Bird"
          onSubmit={handleScoreSubmit}
          onCancel={handleScoreCancel}
        />
      )}
      
      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <Leaderboard
          gameName="Flappy Bird"
          onClose={handleLeaderboardClose}
        />
      )}
    </div>
  );
}

export default FlappyBird; 