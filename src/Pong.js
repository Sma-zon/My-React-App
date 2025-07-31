import React, { useRef, useEffect, useState } from 'react';
import soundManager from './sounds';
import { Link } from 'react-router-dom';
import MobileControls from './MobileControls';

const WIDTH = 600;
const HEIGHT = 400;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 60;
const BALL_SIZE = 10;
const PADDLE_SPEED = 5;
const BALL_SPEED = 4;
const MODES = [
  { name: '2 Player', desc: 'Player vs Player' },
  { name: 'Single Player', desc: 'Player vs AI' },
  { name: 'AI Mode', desc: 'AI vs AI' }
];

function aiMove(paddleY, ballY) {
  // Simple AI: move paddle center toward ball
  const paddleCenter = paddleY + PADDLE_HEIGHT / 2;
  if (paddleCenter < ballY) return Math.min(HEIGHT - PADDLE_HEIGHT, paddleY + PADDLE_SPEED);
  if (paddleCenter > ballY) return Math.max(0, paddleY - PADDLE_SPEED);
  return paddleY;
}

function Pong() {
  const canvasRef = useRef(null);
  const [mode, setMode] = useState(0); // 0: PvP, 1: PvAI, 2: AIvAI
  const [modeName, setModeName] = useState(MODES[0].name);
  const [modeDesc, setModeDesc] = useState(MODES[0].desc);
  const [hitCount, setHitCount] = useState(0);
  const [ballSpeed, setBallSpeed] = useState(BALL_SPEED);
  const [isMobile, setIsMobile] = useState(false);
  const [running, setRunning] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showStartButton, setShowStartButton] = useState(true);
  
  const gameRef = useRef({
    leftY: HEIGHT / 2 - PADDLE_HEIGHT / 2,
    rightY: HEIGHT / 2 - PADDLE_HEIGHT / 2,
    ballX: WIDTH / 2 - BALL_SIZE / 2,
    ballY: HEIGHT / 2 - BALL_SIZE / 2,
    ballVX: BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
    ballVY: BALL_SPEED * (Math.random() > 0.5 ? 1 : -1),
    leftScore: 0,
    rightScore: 0,
    keys: {},
    hitCount: 0,
    ballSpeed: BALL_SPEED,
    lastTime: 0,
    frameCount: 0,
    particles: []
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

  // Mode switching with M key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() === 'm') {
        setMode((m) => (m + 1) % 3);
      }
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

  // Update mode name/desc on mode change
  useEffect(() => {
    setModeName(MODES[mode].name);
    setModeDesc(MODES[mode].desc);
  }, [mode]);

  // Reset ball speed and hit count on mode change
  useEffect(() => {
    setHitCount(0);
    setBallSpeed(BALL_SPEED);
    gameRef.current.hitCount = 0;
    gameRef.current.ballSpeed = BALL_SPEED;
  }, [mode]);

  // Touch controls
  const handleTouchStart = (paddle, direction) => {
    gameRef.current.keys[paddle + direction] = true;
  };

  const handleTouchEnd = (paddle, direction) => {
    gameRef.current.keys[paddle + direction] = false;
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

  // Start game with countdown
  const handleStart = () => {
    soundManager.buttonClick();
    setShowStartButton(false);
    setCountdown(3);
    
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setRunning(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Reset game
  const handleReset = () => {
    setRunning(false);
    setShowStartButton(true);
    setCountdown(0);
    gameRef.current.leftScore = 0;
    gameRef.current.rightScore = 0;
    resetBall(1);
  };

  const resetBall = (dir) => {
    gameRef.current.ballX = WIDTH / 2 - BALL_SIZE / 2;
    gameRef.current.ballY = HEIGHT / 2 - BALL_SIZE / 2;
    gameRef.current.ballVX = gameRef.current.ballSpeed * dir;
    gameRef.current.ballVY = gameRef.current.ballSpeed * (Math.random() > 0.5 ? 1 : -1);
    gameRef.current.hitCount = 0;
    gameRef.current.ballSpeed = BALL_SPEED;
    setBallSpeed(BALL_SPEED);
  };

  useEffect(() => {
    let animationId;
    const ctx = canvasRef.current.getContext('2d');
    
    function draw() {
      // Clear canvas
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      
      // Draw particles
      gameRef.current.particles.forEach(particle => {
        ctx.fillStyle = `rgba(0, 255, 0, ${particle.alpha})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });
      
      // Net with glow effect
      ctx.strokeStyle = '#0f0';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 15]);
      ctx.beginPath();
      ctx.moveTo(WIDTH / 2, 0);
      ctx.lineTo(WIDTH / 2, HEIGHT);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Paddles with enhanced visuals
      const leftY = gameRef.current.leftY;
      const rightY = gameRef.current.rightY;
      
      // Left paddle shadow
      ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
      ctx.fillRect(2, leftY + 2, PADDLE_WIDTH, PADDLE_HEIGHT);
      
      // Left paddle
      ctx.fillStyle = '#0f0';
      ctx.fillRect(0, leftY, PADDLE_WIDTH, PADDLE_HEIGHT);
      
      // Right paddle shadow
      ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
      ctx.fillRect(WIDTH - PADDLE_WIDTH + 2, rightY + 2, PADDLE_WIDTH, PADDLE_HEIGHT);
      
      // Right paddle
      ctx.fillStyle = '#0f0';
      ctx.fillRect(WIDTH - PADDLE_WIDTH, rightY, PADDLE_WIDTH, PADDLE_HEIGHT);
      
      // Ball with enhanced visuals (only if running)
      if (running) {
        const ballX = gameRef.current.ballX;
        const ballY = gameRef.current.ballY;
        
        // Ball shadow
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(ballX + 2, ballY + 2, BALL_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Ball glow
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.arc(ballX, ballY, BALL_SIZE, 0, Math.PI * 2);
        ctx.fill();
        
        // Ball with dark outline for better visibility
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(ballX, ballY, BALL_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Dark outline
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ballX, ballY, BALL_SIZE / 2, 0, Math.PI * 2);
        ctx.stroke();
        
        // Ball trail
        const trailLength = 5;
        for (let i = 1; i <= trailLength; i++) {
          const alpha = 0.3 - (i * 0.05);
          const size = (BALL_SIZE / 2) - (i * 0.5);
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.beginPath();
          ctx.arc(ballX - gameRef.current.ballVX * i * 0.5, 
                  ballY - gameRef.current.ballVY * i * 0.5, 
                  size, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Draw stationary ball in center
        const ballX = WIDTH / 2 - BALL_SIZE / 2;
        const ballY = HEIGHT / 2 - BALL_SIZE / 2;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(ballX + BALL_SIZE / 2, ballY + BALL_SIZE / 2, BALL_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Dark outline
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ballX + BALL_SIZE / 2, ballY + BALL_SIZE / 2, BALL_SIZE / 2, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      // Score with enhanced styling
      ctx.font = '20px monospace';
      ctx.textAlign = 'left';
      ctx.fillStyle = '#0f0';
      ctx.fillText(`Ball Speed: ${gameRef.current.ballSpeed.toFixed(1)}`, 10, HEIGHT - 10);
      ctx.fillText(`Mode: ${modeName}`, 10, HEIGHT - 30);
      ctx.fillText(`Press M to change mode`, 10, HEIGHT - 50);
      
      ctx.textAlign = 'center';
      ctx.font = '32px monospace';
      ctx.fillStyle = '#0f0';
      ctx.fillText(gameRef.current.leftScore, WIDTH / 4, 40);
      ctx.fillText(gameRef.current.rightScore, WIDTH * 3 / 4, 40);

      // Draw countdown
      if (countdown > 0) {
        ctx.font = '48px monospace';
        ctx.fillStyle = '#0f0';
        ctx.textAlign = 'center';
        ctx.fillText(countdown.toString(), WIDTH / 2, HEIGHT / 2);
      }

      // Draw start/reset message
      if (!running && !countdown) {
        ctx.font = '24px monospace';
        ctx.fillStyle = '#0f0';
        ctx.textAlign = 'center';
        ctx.fillText('Click Start to Play', WIDTH / 2, HEIGHT / 2 + 40);
      }
    }
    
    function update() {
      if (!running) return;

      // Update particles
      gameRef.current.particles = gameRef.current.particles.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.alpha -= 0.03;
        particle.life--;
        return particle.life > 0 && particle.alpha > 0;
      });
      
      // Move paddles based on mode
      if (mode === 0) {
        // 2 Player
        if (gameRef.current.keys['w'] || gameRef.current.keys['leftup']) {
          gameRef.current.leftY = Math.max(0, gameRef.current.leftY - PADDLE_SPEED);
        }
        if (gameRef.current.keys['s'] || gameRef.current.keys['leftdown']) {
          gameRef.current.leftY = Math.min(HEIGHT - PADDLE_HEIGHT, gameRef.current.leftY + PADDLE_SPEED);
        }
        // Player 2 uses I/K
        if (gameRef.current.keys['i'] || gameRef.current.keys['rightup']) {
          gameRef.current.rightY = Math.max(0, gameRef.current.rightY - PADDLE_SPEED);
        }
        if (gameRef.current.keys['k'] || gameRef.current.keys['rightdown']) {
          gameRef.current.rightY = Math.min(HEIGHT - PADDLE_HEIGHT, gameRef.current.rightY + PADDLE_SPEED);
        }
      } else if (mode === 1) {
        // Single Player (Player left, AI right)
        if (gameRef.current.keys['w'] || gameRef.current.keys['leftup']) {
          gameRef.current.leftY = Math.max(0, gameRef.current.leftY - PADDLE_SPEED);
        }
        if (gameRef.current.keys['s'] || gameRef.current.keys['leftdown']) {
          gameRef.current.leftY = Math.min(HEIGHT - PADDLE_HEIGHT, gameRef.current.leftY + PADDLE_SPEED);
        }
        gameRef.current.rightY = aiMove(gameRef.current.rightY, gameRef.current.ballY + BALL_SIZE / 2);
      } else if (mode === 2) {
        // AI vs AI
        gameRef.current.leftY = aiMove(gameRef.current.leftY, gameRef.current.ballY + BALL_SIZE / 2);
        gameRef.current.rightY = aiMove(gameRef.current.rightY, gameRef.current.ballY + BALL_SIZE / 2);
      }
      
      // Move ball
      gameRef.current.ballX += gameRef.current.ballVX;
      gameRef.current.ballY += gameRef.current.ballVY;
      
      // Collisions with top/bottom
      if (gameRef.current.ballY <= 0 || gameRef.current.ballY + BALL_SIZE >= HEIGHT) {
        gameRef.current.ballVY *= -1;
        gameRef.current.ballY = Math.max(0, Math.min(HEIGHT - BALL_SIZE, gameRef.current.ballY));
      }
      
      // Collisions with paddles
      let hit = false;
      
      // Left paddle
      if (
        gameRef.current.ballX <= PADDLE_WIDTH &&
        gameRef.current.ballY + BALL_SIZE >= gameRef.current.leftY &&
        gameRef.current.ballY <= gameRef.current.leftY + PADDLE_HEIGHT &&
        gameRef.current.ballVX < 0
      ) {
        gameRef.current.ballVX = Math.abs(gameRef.current.ballVX);
        gameRef.current.ballX = PADDLE_WIDTH; // Prevent sticking
        hit = true;
      }
      
      // Right paddle
      if (
        gameRef.current.ballX + BALL_SIZE >= WIDTH - PADDLE_WIDTH &&
        gameRef.current.ballY + BALL_SIZE >= gameRef.current.rightY &&
        gameRef.current.ballY <= gameRef.current.rightY + PADDLE_HEIGHT &&
        gameRef.current.ballVX > 0
      ) {
        gameRef.current.ballVX = -Math.abs(gameRef.current.ballVX);
        gameRef.current.ballX = WIDTH - PADDLE_WIDTH - BALL_SIZE; // Prevent sticking
        hit = true;
      }
      
      if (hit) {
        soundManager.pongHit();
        gameRef.current.hitCount = (gameRef.current.hitCount || 0) + 1;
        if (gameRef.current.hitCount % 5 === 0) {
          gameRef.current.ballSpeed += 0.5;
          setBallSpeed(gameRef.current.ballSpeed);
        }
        
        // Create hit particles
        for (let i = 0; i < 8; i++) {
          gameRef.current.particles.push({
            x: gameRef.current.ballX + BALL_SIZE / 2,
            y: gameRef.current.ballY + BALL_SIZE / 2,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            size: Math.random() * 3 + 1,
            alpha: 1,
            life: 30
          });
        }
      }
      
      // Score
      if (gameRef.current.ballX < 0) {
        soundManager.pongScore();
        gameRef.current.rightScore++;
        resetBall(-1);
      } else if (gameRef.current.ballX > WIDTH) {
        soundManager.pongScore();
        gameRef.current.leftScore++;
        resetBall(1);
      }
    }
    
    function loop() {
      update();
      draw();
      animationId = requestAnimationFrame(loop);
    }
    
    loop();
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [mode, modeName, running, countdown]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2 style={{ fontFamily: 'monospace', color: '#00ff00', textShadow: '2px 2px #000' }}>Pong</h2>
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
      <div style={{ width: '100%', maxWidth: 600, aspectRatio: '2', margin: '0 auto', marginBottom: 56 }}>
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
        />
      </div>
      <div style={{ 
        position: 'fixed', 
        top: 20, 
        left: '50%', 
        transform: 'translateX(-50%)', 
        zIndex: 1000,
        color: '#0f0', 
        fontFamily: 'monospace', 
        background: 'rgba(0, 0, 0, 0.8)',
        padding: '8px 16px',
        borderRadius: 8,
        border: '2px solid #0f0',
        fontSize: '0.9rem'
      }}>
        Controls: {isMobile ? 'Touch D-pad below' : 'W/S (Left Paddle), I/K or Up/Down (Right Paddle)'}
      </div>
      <div style={{ color: '#0f0', fontFamily: 'monospace', marginBottom: 8 }}>
        Mode: <b>{modeName}</b> - {modeDesc}
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
        {MODES.map((m, idx) => (
          <button
            key={m.name}
            onClick={() => {
              soundManager.buttonClick();
              setMode(idx);
            }}
            style={{
              fontFamily: 'monospace',
              fontSize: '1rem',
              color: idx === mode ? '#111' : '#0f0',
              background: idx === mode ? '#0f0' : '#111',
              border: '2px solid #0f0',
              padding: '6px 16px',
              cursor: 'pointer',
              textShadow: '1px 1px #000'
            }}
          >
            {m.name}
          </button>
        ))}
      </div>

      {/* Start/Reset Button */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        {showStartButton && (
          <button onClick={handleStart} style={{ 
            fontFamily: 'monospace', 
            fontSize: '1.2rem', 
            background: '#222', 
            color: '#0f0', 
            border: '2px solid #0f0', 
            padding: '8px 16px', 
            cursor: 'pointer' 
          }}>
            Start Game
          </button>
        )}
        {running && (
          <button onClick={handleReset} style={{ 
            fontFamily: 'monospace', 
            fontSize: '1.2rem', 
            background: '#222', 
            color: '#0f0', 
            border: '2px solid #0f0', 
            padding: '8px 16px', 
            cursor: 'pointer' 
          }}>
            Reset Game
          </button>
        )}
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
          marginBottom: 16,
          marginTop: 8,
          touchAction: 'manipulation',
          boxShadow: '0 0 10px #0f0',
          borderRadius: '8px',
          fontWeight: 'bold'
        }}
      >
        {document.fullscreenElement ? 'Exit Fullscreen' : 'Fullscreen'}
      </button>
      
      {/* Touch Controls for Mobile */}
      {isMobile && mode !== 2 && running && (
        <div style={{ 
          position: 'fixed', 
          bottom: 60, 
          left: '50%', 
          transform: 'translateX(-50%)', 
          zIndex: 1000,
          background: 'rgba(0, 0, 0, 0.8)',
          padding: 16,
          borderRadius: 12,
          border: '2px solid #0f0',
          display: 'flex',
          gap: 30
        }}>
          <MobileControls
            onUp={() => handleTouchStart('left', 'up')}
            onDown={() => handleTouchStart('left', 'down')}
            onLeft={undefined}
            onRight={undefined}
          />
          {mode === 0 && (
            <MobileControls
              onUp={() => handleTouchStart('right', 'up')}
              onDown={() => handleTouchStart('right', 'down')}
              onLeft={undefined}
              onRight={undefined}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default Pong; 