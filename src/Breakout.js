import React, { useRef, useEffect, useState } from 'react';
import soundManager from './sounds';

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
          setScore(prev => prev + 10);
          gameRef.current.ballVY *= -1;
        }
      });
      
      // Check win
      const bricksLeft = gameRef.current.bricks.filter(brick => brick.alive).length;
      if (bricksLeft === 0) {
        soundManager.breakoutWin();
        setGameOver(true);
        setRunning(false);
      }
    }
    
    function loop() {
      update();
      draw();
      if (!gameOver) animationId = requestAnimationFrame(loop);
    }
    loop();
    return () => cancelAnimationFrame(animationId);
  }, [running, gameOver, lives, score]);

  function handleStart() {
    soundManager.buttonClick();
    initializeBricks();
    gameRef.current.paddleX = WIDTH / 2 - PADDLE_WIDTH / 2;
    gameRef.current.ballX = WIDTH / 2;
    gameRef.current.ballY = HEIGHT - 50;
    gameRef.current.ballVX = 4;
    gameRef.current.ballVY = -4;
    setScore(0);
    setLives(3);
    setGameOver(false);
    setRunning(true);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2 style={{ fontFamily: 'monospace', color: '#00ff00', textShadow: '2px 2px #000' }}>Breakout</h2>
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        style={{ border: '4px solid #0f0', background: '#111', marginBottom: 16 }}
        onTouchMove={handleTouchMove}
        onTouchStart={handleTouchMove}
      />
      <div style={{ color: '#0f0', fontFamily: 'monospace', marginBottom: 8 }}>
        Controls: {isMobile ? 'Touch to move paddle' : 'A/D or Arrow Keys'}
      </div>
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
    </div>
  );
}

export default Breakout; 