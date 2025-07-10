import React, { useRef, useEffect, useState } from 'react';
import soundManager from './sounds';
import { Link } from 'react-router-dom';

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
    frameCount: 0
  });

  // Initialize on first load
  useEffect(() => {
    initializeLevel();
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
    
    // Add some platforms and coins
    for (let i = 5; i < 35; i += 3) {
      level[15][i] = 1; // Platform
      if (Math.random() > 0.5) {
        level[14][i] = 2; // Coin
      }
    }
    
    // Add some enemies
    for (let i = 10; i < 30; i += 5) {
      level[18][i] = 3; // Enemy
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

  // Screen wrapping function
  const wrapPosition = (x, y) => {
    const levelWidth = gameRef.current.level[0].length * TILE_SIZE;
    const levelHeight = gameRef.current.level.length * TILE_SIZE;
    
    let newX = x;
    let newY = y;
    
    // Wrap horizontally
    if (x < 0) {
      newX = levelWidth - PLAYER_SIZE;
    } else if (x > levelWidth - PLAYER_SIZE) {
      newX = 0;
    }
    
    // Wrap vertically (only if falling off bottom)
    if (y > levelHeight) {
      newY = 0;
    }
    
    return { x: newX, y: newY };
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
          ctx.beginPath();
          ctx.arc(coin.x + TILE_SIZE/2, coin.y + TILE_SIZE/2, TILE_SIZE/3, 0, Math.PI * 2);
          ctx.fill();
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
      ctx.fillText(`Score: ${score}`, 10, 30);
      ctx.fillText(`Lives: ${lives}`, 10, 60);
      
      if (gameOver) {
        ctx.font = '32px monospace';
        ctx.fillStyle = '#f00';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over!', WIDTH / 2, HEIGHT / 2);
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
      
      // Check wall collisions - but allow wrapping instead of blocking
      const leftTop = checkTileCollision(playerLeft, playerTop);
      const leftBottom = checkTileCollision(playerLeft, playerBottom);
      
      if (leftTop === 1 || leftBottom === 1) {
        // Instead of blocking, wrap to the right side
        player.x = gameRef.current.level[0].length * TILE_SIZE - PLAYER_SIZE;
      }
      
      const rightTop = checkTileCollision(playerRight, playerTop);
      const rightBottom = checkTileCollision(playerRight, playerBottom);
      
      if (rightTop === 1 || rightBottom === 1) {
        // Instead of blocking, wrap to the left side
        player.x = 0;
      }
      
      // Check coin collisions (optimized)
      const coins = gameRef.current.coins;
      for (let i = coins.length - 1; i >= 0; i--) {
        const coin = coins[i];
        if (!coin.collected && 
            player.x < coin.x + TILE_SIZE &&
            player.x + PLAYER_SIZE > coin.x &&
            player.y < coin.y + TILE_SIZE &&
            player.y + PLAYER_SIZE > coin.y) {
          coin.collected = true;
          setScore(prev => prev + 10);
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
          setLives(prev => prev - 1);
          if (lives <= 1) {
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
        gameRef.current.frameCount++;
      }
      
      if (!gameOver) animationId = requestAnimationFrame(loop);
    }
    loop();
    return () => cancelAnimationFrame(animationId);
  }, [running, gameOver, lives, score]);

  function handleStart() {
    soundManager.buttonClick();
    initializeLevel();
    gameRef.current.player = { x: 50, y: HEIGHT - 60, vx: 0, vy: 0, onGround: false };
    gameRef.current.camera = { x: 0 };
    setScore(0);
    setLives(3);
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
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        style={{ border: '4px solid #0f0', background: '#111', marginBottom: 16 }}
      />
      <div style={{ color: '#0f0', fontFamily: 'monospace', marginBottom: 8 }}>
        Controls: {isMobile ? 'Touch buttons below' : 'Arrow Keys or WASD, SPACE to jump'}
      </div>
      
      {/* Touch Controls for Mobile */}
      {isMobile && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: 15, 
          marginBottom: 16,
          width: 200
        }}>
          <div></div>
          <button
            onTouchStart={() => handleJump()}
            onMouseDown={() => handleJump()}
            style={{
              width: 60,
              height: 60,
              fontSize: '1.5rem',
              background: '#222',
              color: '#0f0',
              border: '3px solid #0f0',
              borderRadius: '50%',
              cursor: 'pointer',
              fontFamily: 'monospace',
              touchAction: 'manipulation'
            }}
          >
            ↑
          </button>
          <div></div>
          
          <button
            onTouchStart={() => gameRef.current.keys['a'] = true}
            onTouchEnd={() => gameRef.current.keys['a'] = false}
            onMouseDown={() => gameRef.current.keys['a'] = true}
            onMouseUp={() => gameRef.current.keys['a'] = false}
            style={{
              width: 60,
              height: 60,
              fontSize: '1.5rem',
              background: '#222',
              color: '#0f0',
              border: '3px solid #0f0',
              borderRadius: '50%',
              cursor: 'pointer',
              fontFamily: 'monospace',
              touchAction: 'manipulation'
            }}
          >
            ←
          </button>
          <button
            onTouchStart={() => gameRef.current.keys['d'] = true}
            onTouchEnd={() => gameRef.current.keys['d'] = false}
            onMouseDown={() => gameRef.current.keys['d'] = true}
            onMouseUp={() => gameRef.current.keys['d'] = false}
            style={{
              width: 60,
              height: 60,
              fontSize: '1.5rem',
              background: '#222',
              color: '#0f0',
              border: '3px solid #0f0',
              borderRadius: '50%',
              cursor: 'pointer',
              fontFamily: 'monospace',
              touchAction: 'manipulation'
            }}
          >
            →
          </button>
          <div></div>
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