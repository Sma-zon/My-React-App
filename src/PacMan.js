import React, { useRef, useEffect, useState } from 'react';
import soundManager from './sounds';
import { Link } from 'react-router-dom';

const WIDTH = 600;
const HEIGHT = 600;
const CELL_SIZE = 20;
const COLS = WIDTH / CELL_SIZE;
const ROWS = HEIGHT / CELL_SIZE;

// Game map (0: wall, 1: dot, 2: power pellet, 3: empty)
const MAP = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,1,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1,0],
  [0,2,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,2,0],
  [0,1,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,1,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,1,0],
  [0,1,1,1,1,1,1,0,0,1,1,1,1,0,0,1,1,1,1,0,0,1,1,1,1,1,1,1,1,0],
  [0,0,0,0,0,0,1,0,0,0,0,0,3,0,0,3,0,0,0,0,0,1,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,0,0,0,0,0,3,0,0,3,0,0,0,0,0,1,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,0,0,3,3,3,3,3,3,3,3,3,3,0,0,1,0,0,0,0,0,0,0,0],
  [3,3,3,3,3,3,1,3,3,3,0,0,0,0,0,0,0,0,3,3,3,1,3,3,3,3,3,3,3,3],
  [0,0,0,0,0,0,1,0,0,3,3,3,3,3,3,3,3,3,3,0,0,1,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,0,0,0,0,0,3,0,0,3,0,0,0,0,0,1,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,0,0,0,0,0,3,0,0,3,0,0,0,0,0,1,0,0,0,0,0,0,0,0],
  [0,1,1,1,1,1,1,0,0,1,1,1,1,0,0,1,1,1,1,0,0,1,1,1,1,1,1,1,1,0],
  [0,1,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,1,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,1,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1,0],
  [0,2,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,2,0],
  [0,1,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];

function PacMan() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [gameMap, setGameMap] = useState([]);
  const gameRef = useRef({
    pacman: { x: 14, y: 17, dir: { x: 0, y: 0 }, nextDir: { x: 0, y: 0 }, mouth: 0 },
    ghosts: [
      { x: 14, y: 11, dir: { x: -1, y: 0 }, color: '#ff0000', mode: 'chase' },
      { x: 13, y: 14, dir: { x: 1, y: 0 }, color: '#ffb8ff', mode: 'chase' },
      { x: 14, y: 14, dir: { x: 0, y: -1 }, color: '#00ffff', mode: 'chase' },
      { x: 15, y: 14, dir: { x: 0, y: 1 }, color: '#ffb852', mode: 'chase' }
    ],
    powerMode: false,
    powerTimer: 0,
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

  // Initialize game map
  const initializeMap = () => {
    setGameMap(MAP.map(row => [...row]));
  };

  // Initialize on first load
  useEffect(() => {
    initializeMap();
    setRunning(true);
    setGameOver(false);
    setScore(0);
    setLives(3);
  }, []);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      gameRef.current.keys[e.key.toLowerCase()] = true;
      
      // Set next direction
      if (e.key === 'ArrowUp' || e.key === 'w') {
        gameRef.current.nextDir = { x: 0, y: -1 };
      } else if (e.key === 'ArrowDown' || e.key === 's') {
        gameRef.current.nextDir = { x: 0, y: 1 };
      } else if (e.key === 'ArrowLeft' || e.key === 'a') {
        gameRef.current.nextDir = { x: -1, y: 0 };
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        gameRef.current.nextDir = { x: 1, y: 0 };
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
    gameRef.current.nextDir = direction;
  };

  // Check if position is valid
  const isValidPosition = (x, y) => {
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return false;
    return gameMap[y] && gameMap[y][x] !== 0;
  };

  // Move entity
  const moveEntity = (entity, dir) => {
    const newX = entity.x + dir.x;
    const newY = entity.y + dir.y;
    
    // Handle tunnel
    if (newX < 0) return { x: COLS - 1, y: newY };
    if (newX >= COLS) return { x: 0, y: newY };
    
    if (isValidPosition(newX, newY)) {
      return { x: newX, y: newY };
    }
    return { x: entity.x, y: entity.y };
  };

  // Ghost AI
  const getGhostDirection = (ghost) => {
    const directions = [
      { x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: -1 }, { x: 0, y: 1 }
    ];
    
    if (gameRef.current.powerMode) {
      // Scatter mode - move away from pacman
      const dx = ghost.x - gameRef.current.pacman.x;
      const dy = ghost.y - gameRef.current.pacman.y;
      const targetDir = { x: Math.sign(dx), y: Math.sign(dy) };
      
      // Find valid direction away from pacman
      for (const dir of directions) {
        if (dir.x !== -ghost.dir.x || dir.y !== -ghost.dir.y) {
          const newPos = moveEntity(ghost, dir);
          if (newPos.x !== ghost.x || newPos.y !== ghost.y) {
            return dir;
          }
        }
      }
    } else {
      // Chase mode - move towards pacman
      const dx = gameRef.current.pacman.x - ghost.x;
      const dy = gameRef.current.pacman.y - ghost.y;
      
      // Simple AI: prefer horizontal movement
      if (Math.abs(dx) > Math.abs(dy)) {
        const dir = { x: Math.sign(dx), y: 0 };
        if (isValidPosition(ghost.x + dir.x, ghost.y + dir.y)) {
          return dir;
        }
      }
      
      const dir = { x: 0, y: Math.sign(dy) };
      if (isValidPosition(ghost.x + dir.x, ghost.y + dir.y)) {
        return dir;
      }
    }
    
    // Random direction if can't move towards/away
    const validDirs = directions.filter(dir => 
      isValidPosition(ghost.x + dir.x, ghost.y + dir.y) &&
      (dir.x !== -ghost.dir.x || dir.y !== -ghost.dir.y)
    );
    
    return validDirs[Math.floor(Math.random() * validDirs.length)] || ghost.dir;
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
      
      // Draw map
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const cell = gameMap[y][x];
          if (cell === 0) {
            // Wall
            ctx.fillStyle = '#0066ff';
            ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
          } else if (cell === 1) {
            // Dot
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.arc(x * CELL_SIZE + CELL_SIZE/2, y * CELL_SIZE + CELL_SIZE/2, 2, 0, Math.PI * 2);
            ctx.fill();
          } else if (cell === 2) {
            // Power pellet
            ctx.fillStyle = '#ffff00';
            ctx.beginPath();
            ctx.arc(x * CELL_SIZE + CELL_SIZE/2, y * CELL_SIZE + CELL_SIZE/2, 6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      
      // Draw Pac-Man
      const pacman = gameRef.current.pacman;
      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      const centerX = pacman.x * CELL_SIZE + CELL_SIZE/2;
      const centerY = pacman.y * CELL_SIZE + CELL_SIZE/2;
      const radius = CELL_SIZE/2 - 2;
      
      let startAngle = 0;
      let endAngle = Math.PI * 2;
      
      if (pacman.dir.x === 1) startAngle = 0.2;
      else if (pacman.dir.x === -1) startAngle = Math.PI + 0.2;
      else if (pacman.dir.y === -1) startAngle = Math.PI/2 + 0.2;
      else if (pacman.dir.y === 1) startAngle = 3*Math.PI/2 + 0.2;
      
      if (pacman.dir.x !== 0 || pacman.dir.y !== 0) {
        endAngle = startAngle + Math.PI * 2 - 0.4;
      }
      
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.lineTo(centerX, centerY);
      ctx.fill();
      
      // Draw ghosts
      gameRef.current.ghosts.forEach(ghost => {
        ctx.fillStyle = gameRef.current.powerMode ? '#0000ff' : ghost.color;
        ctx.beginPath();
        ctx.arc(ghost.x * CELL_SIZE + CELL_SIZE/2, ghost.y * CELL_SIZE + CELL_SIZE/2, CELL_SIZE/2 - 2, 0, Math.PI * 2);
        ctx.fill();
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
      // Update Pac-Man
      const pacman = gameRef.current.pacman;
      
      // Try to change direction
      if (gameRef.current.nextDir.x !== 0 || gameRef.current.nextDir.y !== 0) {
        const newPos = moveEntity(pacman, gameRef.current.nextDir);
        if (newPos.x !== pacman.x || newPos.y !== pacman.y) {
          pacman.dir = { ...gameRef.current.nextDir };
          gameRef.current.nextDir = { x: 0, y: 0 };
        }
      }
      
      // Move Pac-Man
      const newPos = moveEntity(pacman, pacman.dir);
      if (newPos.x !== pacman.x || newPos.y !== pacman.y) {
        pacman.x = newPos.x;
        pacman.y = newPos.y;
        soundManager.pacmanMove();
        
        // Animate mouth
        pacman.mouth = (pacman.mouth + 0.2) % 1;
      }
      
      // Check for dots
      if (gameMap[pacman.y] && gameMap[pacman.y][pacman.x] === 1) {
        soundManager.pacmanEat();
        const newMap = gameMap.map(row => [...row]);
        newMap[pacman.y][pacman.x] = 3;
        setGameMap(newMap);
        setScore(prev => prev + 10);
      } else if (gameMap[pacman.y] && gameMap[pacman.y][pacman.x] === 2) {
        soundManager.pacmanEatPower();
        const newMap = gameMap.map(row => [...row]);
        newMap[pacman.y][pacman.x] = 3;
        setGameMap(newMap);
        setScore(prev => prev + 50);
        gameRef.current.powerMode = true;
        gameRef.current.powerTimer = 300; // 5 seconds at 60fps
      }
      
      // Update power mode
      if (gameRef.current.powerMode) {
        gameRef.current.powerTimer--;
        if (gameRef.current.powerTimer <= 0) {
          gameRef.current.powerMode = false;
        }
      }
      
      // Update ghosts
      gameRef.current.ghosts.forEach(ghost => {
        // Change direction occasionally
        if (Math.random() < 0.02) {
          ghost.dir = getGhostDirection(ghost);
        }
        
        // Move ghost
        const newPos = moveEntity(ghost, ghost.dir);
        ghost.x = newPos.x;
        ghost.y = newPos.y;
        
        // Check collision with Pac-Man
        if (ghost.x === pacman.x && ghost.y === pacman.y) {
          if (gameRef.current.powerMode) {
            // Ghost eaten
            ghost.x = 14;
            ghost.y = 11;
            setScore(prev => prev + 200);
          } else {
            // Pac-Man eaten
            soundManager.pacmanDeath();
            setLives(prev => prev - 1);
            if (lives <= 1) {
              setGameOver(true);
              setRunning(false);
            } else {
              // Reset positions
              pacman.x = 14;
              pacman.y = 17;
              pacman.dir = { x: 0, y: 0 };
              gameRef.current.ghosts.forEach((g, i) => {
                g.x = 13 + i;
                g.y = 11;
              });
            }
          }
        }
      });
      
      // Check win condition
      const dotsLeft = gameMap.flat().filter(cell => cell === 1 || cell === 2).length;
      if (dotsLeft === 0) {
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
  }, [running, gameOver, lives, score, gameMap]);

  function handleStart() {
    soundManager.buttonClick();
    initializeMap();
    gameRef.current.pacman = { x: 14, y: 17, dir: { x: 0, y: 0 }, nextDir: { x: 0, y: 0 }, mouth: 0 };
    gameRef.current.ghosts = [
      { x: 14, y: 11, dir: { x: -1, y: 0 }, color: '#ff0000', mode: 'chase' },
      { x: 13, y: 14, dir: { x: 1, y: 0 }, color: '#ffb8ff', mode: 'chase' },
      { x: 14, y: 14, dir: { x: 0, y: -1 }, color: '#00ffff', mode: 'chase' },
      { x: 15, y: 14, dir: { x: 0, y: 1 }, color: '#ffb852', mode: 'chase' }
    ];
    gameRef.current.powerMode = false;
    gameRef.current.powerTimer = 0;
    setScore(0);
    setLives(3);
    setGameOver(false);
    setRunning(true);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2 style={{ fontFamily: 'monospace', color: '#00ff00', textShadow: '2px 2px #000' }}>Pac-Man</h2>
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
        Controls: {isMobile ? 'Touch buttons below' : 'Arrow Keys or WASD'}
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
            onClick={() => handleTouchDirection({ x: 0, y: -1 })}
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
            onClick={() => handleTouchDirection({ x: -1, y: 0 })}
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
            onClick={() => handleTouchDirection({ x: 0, y: 1 })}
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
            ↓
          </button>
          <button
            onClick={() => handleTouchDirection({ x: 1, y: 0 })}
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

export default PacMan; 