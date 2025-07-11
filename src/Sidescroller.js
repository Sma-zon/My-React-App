import React, { useRef, useEffect, useState } from 'react';
import soundManager from './sounds';
import { Link } from 'react-router-dom';
import MobileControls from './MobileControls';

const WIDTH = 600;
const HEIGHT = 200;
const GROUND = HEIGHT - 40;
const PLAYER_SIZE = 24;
const OBSTACLE_WIDTH = 20;
const OBSTACLE_HEIGHT = 40;
const GRAVITY = 1.2;
const JUMP = -16;
const SPEED = 5;

function Sidescroller() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const gameRef = useRef({
    playerX: 60,
    playerY: GROUND - PLAYER_SIZE,
    playerVY: 0,
    obstacles: [],
    frame: 0,
    keys: {},
    lastScoredObstacle: null
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
  const handleTouchStart = (action) => {
    gameRef.current.keys[action] = true;
  };

  const handleTouchEnd = (action) => {
    gameRef.current.keys[action] = false;
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

  useEffect(() => {
    if (!running) return;
    let animationId;
    function draw() {
      const ctx = canvasRef.current.getContext('2d');
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      // Ground
      ctx.fillStyle = '#0f0';
      ctx.fillRect(0, GROUND, WIDTH, HEIGHT - GROUND);
      // Player
      ctx.fillStyle = '#ff0';
      ctx.fillRect(gameRef.current.playerX, gameRef.current.playerY, PLAYER_SIZE, PLAYER_SIZE);
      // Obstacles
      ctx.fillStyle = '#f00';
      for (const obs of gameRef.current.obstacles) {
        ctx.fillRect(obs.x, obs.y, OBSTACLE_WIDTH, OBSTACLE_HEIGHT);
      }
      // Score
      ctx.font = '20px monospace';
      ctx.fillStyle = '#0f0';
      ctx.fillText('Score: ' + score, 10, 30);
      if (gameOver) {
        ctx.font = '32px monospace';
        ctx.fillStyle = '#f00';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2);
      }
    }
    function update() {
      // Player movement
      if (gameRef.current.keys['a'] || gameRef.current.keys['left']) {
        gameRef.current.playerX = Math.max(0, gameRef.current.playerX - SPEED);
      }
      if (gameRef.current.keys['d'] || gameRef.current.keys['right']) {
        gameRef.current.playerX = Math.min(WIDTH - PLAYER_SIZE, gameRef.current.playerX + SPEED);
      }
      // Jump
      if ((gameRef.current.keys[' '] || gameRef.current.keys['jump']) && gameRef.current.playerY + PLAYER_SIZE >= GROUND) {
        soundManager.sidescrollerJump();
        gameRef.current.playerVY = JUMP;
      }
      // Gravity
      gameRef.current.playerVY += GRAVITY;
      gameRef.current.playerY += gameRef.current.playerVY;
      if (gameRef.current.playerY + PLAYER_SIZE > GROUND) {
        gameRef.current.playerY = GROUND - PLAYER_SIZE;
        gameRef.current.playerVY = 0;
      }
      // Obstacles
      if (gameRef.current.frame % 60 === 0) {
        gameRef.current.obstacles.push({ x: WIDTH, y: GROUND - OBSTACLE_HEIGHT, scored: false });
      }
      for (const obs of gameRef.current.obstacles) {
        obs.x -= SPEED;
      }
      // Remove off-screen obstacles
      gameRef.current.obstacles = gameRef.current.obstacles.filter(obs => obs.x + OBSTACLE_WIDTH > 0);
      // Collision
      for (const obs of gameRef.current.obstacles) {
        if (
          gameRef.current.playerX < obs.x + OBSTACLE_WIDTH &&
          gameRef.current.playerX + PLAYER_SIZE > obs.x &&
          gameRef.current.playerY < obs.y + OBSTACLE_HEIGHT &&
          gameRef.current.playerY + PLAYER_SIZE > obs.y
        ) {
          soundManager.sidescrollerGameOver();
          setGameOver(true);
          setRunning(false);
        }
      }
      // Score: only increase when player passes over a red block
      for (const obs of gameRef.current.obstacles) {
        if (!obs.scored &&
          gameRef.current.playerX > obs.x + OBSTACLE_WIDTH &&
          gameRef.current.playerX - SPEED <= obs.x + OBSTACLE_WIDTH
        ) {
          obs.scored = true;
          soundManager.sidescrollerScore();
          setScore(s => s + 1);
        }
      }
      gameRef.current.frame++;
    }
    function loop() {
      update();
      draw();
      if (!gameOver) animationId = requestAnimationFrame(loop);
    }
    loop();
    return () => cancelAnimationFrame(animationId);
  }, [running, gameOver]);

  function handleStart() {
    soundManager.buttonClick();
    gameRef.current.playerX = 60;
    gameRef.current.playerY = GROUND - PLAYER_SIZE;
    gameRef.current.playerVY = 0;
    gameRef.current.obstacles = [];
    gameRef.current.frame = 0;
    setScore(0);
    setGameOver(false);
    setRunning(true);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2 style={{ fontFamily: 'monospace', color: '#00ff00', textShadow: '2px 2px #000' }}>Mini Sidescroller</h2>
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
      <div style={{ width: '100%', maxWidth: 600, aspectRatio: '3', margin: '0 auto', marginBottom: 16 }}>
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
      <div style={{ color: '#0f0', fontFamily: 'monospace', marginBottom: 8 }}>
        Controls: {isMobile ? 'Touch D-pad below' : 'A/D (Move), Space (Jump)'}
      </div>
      {(!running || gameOver) && (
        <button onClick={handleStart} style={{ fontFamily: 'monospace', fontSize: '1.2rem', background: '#222', color: '#0f0', border: '2px solid #0f0', padding: '8px 16px', cursor: 'pointer' }}>
          {score === 0 ? 'Start' : 'Restart'}
        </button>
      )}
      
      {/* Touch Controls for Mobile */}
      {isMobile && running && !gameOver && (
        <MobileControls
          onUp={() => { gameRef.current.keys[' '] = true; setTimeout(() => { gameRef.current.keys[' '] = false; }, 150); }}
          onDown={undefined}
          onLeft={() => { gameRef.current.keys['a'] = true; setTimeout(() => { gameRef.current.keys['a'] = false; }, 150); }}
          onRight={() => { gameRef.current.keys['d'] = true; setTimeout(() => { gameRef.current.keys['d'] = false; }, 150); }}
        />
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

export default Sidescroller; 