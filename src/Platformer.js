import React, { useRef, useEffect, useState } from 'react';
import soundManager from './sounds';
import { Link } from 'react-router-dom';
import MobileControls from './MobileControls';

const WIDTH = 800;
const HEIGHT = 400;
const PLAYER_SIZE = 20;
const TILE_SIZE = 20;
const GRAVITY = 0.5;
const JUMP_FORCE = -12;
const MOVE_SPEED = 3;

// Level design (0: empty, 1: ground, 2: coin, 3: enemy)
const LEVEL = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

function Platformer() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const gameRef = useRef({
    player: { x: 50, y: HEIGHT - 60, vx: 0, vy: 0, onGround: false },
    enemies: [],
    coins: [],
    level: [],
    keys: {},
    camera: { x: 0 },
    lastTime: 0,
    frameCount: 0,
    lives: 3,
    score: 0
  });

  // Initialize on first load
  useEffect(() => {
    if (!canvasRef.current) {
      console.error("Canvas ref not available");
      return;
    }
    
    // Ensure canvas context is available
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) {
      console.error("Canvas context not available");
      return;
    }
    
    initializeLevel();
    setRunning(true);
    setGameOver(false);
    gameRef.current.score = 0;
    gameRef.current.lives = 3;
    setScore(0);
    setLives(3);
  }, []);

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
        handleJump();
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
  }, []);

  // Touch controls
  const handleTouchDirection = (direction) => {
    if (direction.x === 0 && direction.y === -1) {
      handleJump();
    }
  };

  // Handle jump
  const handleJump = () => {
    if (!running || gameOver) return;
    const player = gameRef.current.player;
    if (player.onGround) {
      player.vy = JUMP_FORCE;
      player.onGround = false;
      soundManager.platformerJump();
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

  // Initialize level
  const initializeLevel = () => {
    const level = LEVEL.map(row => [...row]);
    
    // Add more platforms and coins for better gameplay
    for (let i = 5; i < 35; i += 2) {
      level[15][i] = 1; // Platform
      if (Math.random() > 0.3) {
        level[14][i] = 2; // Coin
      }
    }
    
    // Add some floating platforms
    for (let i = 8; i < 32; i += 4) {
      level[12][i] = 1; // Higher platform
      if (Math.random() > 0.5) {
        level[11][i] = 2; // Coin on higher platform
      }
    }
    
    // Add some enemies on the ground
    for (let i = 10; i < 30; i += 6) {
      level[17][i] = 3; // Enemy on ground
    }
    
    gameRef.current.level = level;
    
    // Initialize coins and enemies
    const coins = [];
    const enemies = [];
    
    for (let y = 0; y < level.length; y++) {
      for (let x = 0; x < level[y].length; x++) {
        if (level[y][x] === 2) {
          coins.push({ x: x * TILE_SIZE, y: y * TILE_SIZE, collected: false });
        } else if (level[y][x] === 3) {
          enemies.push({ x: x * TILE_SIZE, y: y * TILE_SIZE, direction: 1, speed: 1 });
        }
      }
    }
    
    gameRef.current.coins = coins;
    gameRef.current.enemies = enemies;
  };

  // Check collision with tiles
  const checkTileCollision = (x, y) => {
    const tileX = Math.floor(x / TILE_SIZE);
    const tileY = Math.floor(y / TILE_SIZE);
    
    if (tileY < 0 || tileY >= gameRef.current.level.length || 
        tileX < 0 || tileX >= gameRef.current.level[0].length) {
      return 1; // Treat out of bounds as solid
    }
    
    return gameRef.current.level[tileY][tileX];
  };

  // Screen wrapping function - REMOVED problematic vertical wrapping
  const wrapPosition = (x, y) => {
    const levelWidth = gameRef.current.level[0].length * TILE_SIZE;
    
    let newX = x;
    
    // Only wrap horizontally, not vertically
    if (x < 0) {
      newX = levelWidth - PLAYER_SIZE;
    } else if (x > levelWidth - PLAYER_SIZE) {
      newX = 0;
    }
    
    // Don't wrap vertically - let gravity handle falling
    return { x: newX, y: y };
  };

  // Game loop
  useEffect(() => {
    if (!running) {
      return;
    }
    
    let animationId;
    function draw() {
      try {
        const ctx = canvasRef.current.getContext('2d');
        
        // Clear canvas
        ctx.fillStyle = '#87CEEB';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
      
      // Apply camera offset
      ctx.save();
      ctx.translate(-gameRef.current.camera.x, 0);
      
      // Draw level (optimized - only draw visible tiles)
      const level = gameRef.current.level;
      const cameraX = gameRef.current.camera.x;
      const startX = Math.floor(cameraX / TILE_SIZE);
      const endX = Math.min(startX + Math.ceil(WIDTH / TILE_SIZE) + 2, level[0].length);
      
      for (let y = 0; y < level.length; y++) {
        for (let x = Math.max(0, startX); x < endX; x++) {
          const tile = level[y][x];
          if (tile === 1) {
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          }
        }
      }
      
      // Draw coins (optimized - only draw visible ones)
      const coins = gameRef.current.coins;
      for (let i = 0; i < coins.length; i++) {
        const coin = coins[i];
        if (!coin.collected && 
            coin.x + TILE_SIZE > cameraX && 
            coin.x < cameraX + WIDTH) {
          ctx.fillStyle = '#FFD700';
          // Draw 2x2 yellow blocks instead of circles
          ctx.fillRect(coin.x, coin.y, TILE_SIZE * 2, TILE_SIZE * 2);
        }
      }
      
      // Draw enemies (optimized - only draw visible ones)
      const enemies = gameRef.current.enemies;
      for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        if (enemy.x + TILE_SIZE > cameraX && 
            enemy.x < cameraX + WIDTH) {
          ctx.fillStyle = '#FF0000';
          ctx.fillRect(enemy.x, enemy.y, TILE_SIZE, TILE_SIZE);
        }
      }
      
      // Draw player with enhanced visuals
      const player = gameRef.current.player;
      
      // Player shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(player.x + 2, player.y + 2, PLAYER_SIZE, PLAYER_SIZE);
      
      // Player body
      ctx.fillStyle = '#00FF00';
      ctx.fillRect(player.x, player.y, PLAYER_SIZE, PLAYER_SIZE);
      
      // Player eyes
      ctx.fillStyle = '#000';
      ctx.fillRect(player.x + 4, player.y + 4, 3, 3);
      ctx.fillRect(player.x + 13, player.y + 4, 3, 3);
      
      // Player mouth
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(player.x + 8, player.y + 12, 4, 2);
      
      ctx.restore();
      
      // Draw UI
      ctx.font = '20px monospace';
      ctx.fillStyle = '#0f0';
      ctx.fillText(`Score: ${gameRef.current.score}`, 10, 30);
      ctx.fillText(`Lives: ${gameRef.current.lives}`, 10, 60);
      
      // Update state to keep UI in sync
      setScore(gameRef.current.score);
      setLives(gameRef.current.lives);
      
      if (gameOver) {
        ctx.font = '32px monospace';
        ctx.fillStyle = '#f00';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over!', WIDTH / 2, HEIGHT / 2);
      }
    } catch (e) {
      console.error("Error drawing canvas:", e);
    }
  }
    
    function update() {
      const player = gameRef.current.player;
      
      // Handle input - allow movement in all directions
      if (gameRef.current.keys['arrowleft'] || gameRef.current.keys['a']) {
        player.vx = -MOVE_SPEED;
      } else if (gameRef.current.keys['arrowright'] || gameRef.current.keys['d']) {
        player.vx = MOVE_SPEED;
      } else {
        player.vx = 0;
      }
      
      // Apply gravity
      player.vy += GRAVITY;
      
      // Update position
      player.x += player.vx;
      player.y += player.vy;
      
      // Apply screen wrapping
      const wrapped = wrapPosition(player.x, player.y);
      player.x = wrapped.x;
      player.y = wrapped.y;
      
      // Check collisions
      const playerLeft = player.x;
      const playerRight = player.x + PLAYER_SIZE;
      const playerTop = player.y;
      const playerBottom = player.y + PLAYER_SIZE;
      
      // Check ground collision
      const bottomLeft = checkTileCollision(playerLeft, playerBottom);
      const bottomRight = checkTileCollision(playerRight, playerBottom);
      
      if (bottomLeft === 1 || bottomRight === 1) {
        player.y = Math.floor(playerBottom / TILE_SIZE) * TILE_SIZE - PLAYER_SIZE;
        player.vy = 0;
        player.onGround = true;
      } else {
        player.onGround = false;
      }
      
      // Check ceiling collision
      const topLeft = checkTileCollision(playerLeft, playerTop);
      const topRight = checkTileCollision(playerRight, playerTop);
      
      if (topLeft === 1 || topRight === 1) {
        player.y = Math.floor(playerTop / TILE_SIZE) * TILE_SIZE + TILE_SIZE;
        player.vy = 0;
      }
      
      // Check wall collisions - properly block instead of wrapping
      const leftTop = checkTileCollision(playerLeft, playerTop);
      const leftBottom = checkTileCollision(playerLeft, playerBottom);
      
      if (leftTop === 1 || leftBottom === 1) {
        // Block movement instead of wrapping
        player.x = Math.floor(playerLeft / TILE_SIZE) * TILE_SIZE + TILE_SIZE;
      }
      
      const rightTop = checkTileCollision(playerRight, playerTop);
      const rightBottom = checkTileCollision(playerRight, playerBottom);
      
      if (rightTop === 1 || rightBottom === 1) {
        // Block movement instead of wrapping
        player.x = Math.floor(playerRight / TILE_SIZE) * TILE_SIZE - PLAYER_SIZE;
      }
      
      // Check if player fell off the bottom of the screen
      if (player.y > HEIGHT) {
        gameRef.current.lives--;
        if (gameRef.current.lives <= 1) {
          setGameOver(true);
          setRunning(false);
          soundManager.platformerDeath();
          return;
        } else {
          // Reset player position
          player.x = 50;
          player.y = HEIGHT - 60;
          player.vx = 0;
          player.vy = 0;
          soundManager.platformerDeath();
          return;
        }
      }
      
      // Check coin collisions (optimized)
      const coins = gameRef.current.coins;
      for (let i = coins.length - 1; i >= 0; i--) {
        const coin = coins[i];
        if (!coin.collected && 
            player.x < coin.x + TILE_SIZE * 2 &&
            player.x + PLAYER_SIZE > coin.x &&
            player.y < coin.y + TILE_SIZE * 2 &&
            player.y + PLAYER_SIZE > coin.y) {
          coin.collected = true;
          gameRef.current.score += 10;
          soundManager.platformerCollect();
        }
      }
      
      // Update enemies (optimized)
      const enemies = gameRef.current.enemies;
      for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.x += enemy.speed * enemy.direction;
        
        // Check enemy wall collision
        const enemyLeft = enemy.x;
        const enemyRight = enemy.x + TILE_SIZE;
        const enemyBottom = enemy.y + TILE_SIZE;
        
        const leftTile = checkTileCollision(enemyLeft, enemyBottom);
        const rightTile = checkTileCollision(enemyRight, enemyBottom);
        
        if (leftTile !== 1 || rightTile !== 1) {
          enemy.direction *= -1;
        }
        
        // Check player-enemy collision (optimized)
        if (player.x < enemy.x + TILE_SIZE &&
            player.x + PLAYER_SIZE > enemy.x &&
            player.y < enemy.y + TILE_SIZE &&
            player.y + PLAYER_SIZE > enemy.y) {
          gameRef.current.lives--;
          if (gameRef.current.lives <= 1) {
            setGameOver(true);
            setRunning(false);
            soundManager.platformerDeath();
            return;
          } else {
            // Reset player position
            player.x = 50;
            player.y = HEIGHT - 60;
            player.vx = 0;
            player.vy = 0;
            soundManager.platformerDeath();
            return;
          }
        }
      }
      
      // Update camera
      gameRef.current.camera.x = player.x - WIDTH / 2;
      gameRef.current.camera.x = Math.max(0, gameRef.current.camera.x);
    }
    
    function loop(currentTime) {
      // Frame rate limiting for consistent gameplay
      if (currentTime - gameRef.current.lastTime >= 16) { // ~60 FPS
        update();
        draw();
        gameRef.current.lastTime = currentTime;
      }
      
      if (!gameOver) animationId = requestAnimationFrame(loop);
    }
    loop();
    return () => cancelAnimationFrame(animationId);
  }, [running, gameOver]);

  function handleStart() {
    soundManager.buttonClick();
    initializeLevel();
    gameRef.current.player = { x: 50, y: HEIGHT - 60, vx: 0, vy: 0, onGround: false };
    gameRef.current.camera = { x: 0 };
    gameRef.current.score = 0;
    gameRef.current.lives = 3;
    setGameOver(false);
    setRunning(true);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2 style={{ fontFamily: 'monospace', color: '#00ff00', textShadow: '2px 2px #000' }}>Platformer</h2>
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
      <div style={{ width: '100%', maxWidth: 600, aspectRatio: '2.5', margin: '0 auto', marginBottom: 16 }}>
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
        Controls: {isMobile ? 'Touch D-pad below' : 'Arrow Keys or WASD, SPACE to jump'}
      </div>
      {/* Mobile D-pad Controls */}
      {isMobile && running && !gameOver && (
        <div style={{ 
          position: 'fixed', 
          bottom: 20, 
          left: '50%', 
          transform: 'translateX(-50%)', 
          zIndex: 1000,
          background: 'rgba(0, 0, 0, 0.8)',
          padding: 16,
          borderRadius: 12,
          border: '2px solid #0f0'
        }}>
          <MobileControls
            onUp={handleJump}
            onDown={undefined}
            onLeft={() => { gameRef.current.keys['a'] = true; setTimeout(() => { gameRef.current.keys['a'] = false; }, 150); }}
            onRight={() => { gameRef.current.keys['d'] = true; setTimeout(() => { gameRef.current.keys['d'] = false; }, 150); }}
          />
        </div>
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
    </div>
  );
}

export default Platformer; 