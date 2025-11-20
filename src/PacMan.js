import React, { useRef, useEffect, useState } from 'react';
import soundManager from './sounds';
import { Link } from 'react-router-dom';
import MobileControls from './MobileControls';

const WIDTH = 600;
const HEIGHT = 600;
const CELL_SIZE = 20;
const COLS = WIDTH / CELL_SIZE;
const ROWS = HEIGHT / CELL_SIZE;

// Game map (0: wall, 1: dot, 2: power pellet, 3: empty)
// Classic Pac-Man style maze
const MAP = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,1,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1,0],
  [0,2,0,0,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,2,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,1,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,1,0],
  [0,1,1,1,1,1,1,0,0,1,1,1,1,0,0,1,1,1,1,0,0,1,1,1,1,1,1,1,1,0],
  [0,0,0,0,0,0,1,0,0,0,0,0,3,0,0,3,0,0,0,0,0,1,0,0,0,0,0,0,0,0],
  [1,1,1,1,1,1,1,0,0,3,3,3,3,3,3,3,3,3,3,0,0,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,1,0,0,3,0,0,0,0,0,0,0,0,3,0,0,1,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,1,0,0,3,0,0,0,0,0,0,0,0,3,0,0,1,0,0,0,0,0,0,0,1],
  [0,0,0,0,0,0,1,0,0,3,0,0,0,0,0,0,0,0,3,0,0,1,0,0,0,0,0,0,0,0],
  [1,1,1,1,1,1,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,1,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0],
  [1,1,1,1,1,1,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,1,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,1,0,0,3,0,0,0,0,0,0,0,0,3,0,0,1,0,0,0,0,0,0,0,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,1,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0],
  [0,1,1,1,0,0,1,0,0,1,1,1,1,0,0,1,1,1,1,0,0,1,0,0,1,1,1,1,0,0],
  [0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0],
  [0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0],
  [0,2,1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1,1,2,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];

function PacMan() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const gameMapRef = useRef(MAP.map(row => [...row]));
  const animationRef = useRef(null);
  
  const gameRef = useRef({
    pacman: { x: 15, y: 23, dir: { x: 0, y: 0 }, nextDir: { x: 0, y: 0 }, mouth: 0 },
    nextDir: { x: 0, y: 0 },
    ghosts: [
      { x: 13, y: 12, dir: { x: -1, y: 0 }, color: '#ff0000' },
      { x: 14, y: 12, dir: { x: 1, y: 0 }, color: '#ffb8ff' },
      { x: 15, y: 12, dir: { x: 0, y: -1 }, color: '#00ffff' },
      { x: 16, y: 12, dir: { x: 0, y: 1 }, color: '#ffb852' }
    ],
    powerMode: false,
    powerTimer: 0
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

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!running || gameOver) return;
      
      const key = e.key.toLowerCase();
      if (e.key === 'ArrowUp' || key === 'w') {
        gameRef.current.nextDir = { x: 0, y: -1 };
      } else if (e.key === 'ArrowDown' || key === 's') {
        gameRef.current.nextDir = { x: 0, y: 1 };
      } else if (e.key === 'ArrowLeft' || key === 'a') {
        gameRef.current.nextDir = { x: -1, y: 0 };
      } else if (e.key === 'ArrowRight' || key === 'd') {
        gameRef.current.nextDir = { x: 1, y: 0 };
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [running, gameOver]);

  // Touch controls
  const handleTouchDirection = (direction) => {
    if (!running || gameOver) return;
    gameRef.current.nextDir = direction;
  };

  // Check if position is valid
  const isValidPosition = (x, y) => {
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return false;
    return gameMapRef.current[y] && gameMapRef.current[y][x] !== 0;
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
    
    // Get valid directions (not walls, not reversing)
    const validDirs = directions.filter(dir => {
      if (dir.x === -ghost.dir.x && dir.y === -ghost.dir.y) return false; // Don't reverse
      const newPos = moveEntity(ghost, dir);
      return newPos.x !== ghost.x || newPos.y !== ghost.y; // Must be able to move
    });
    
    if (validDirs.length === 0) return ghost.dir; // No valid directions, keep current
    
    if (gameRef.current.powerMode) {
      // Escape mode - move away from Pac-Man
      const pacman = gameRef.current.pacman;
      const dx = ghost.x - pacman.x; // Reversed: away from Pac-Man
      const dy = ghost.y - pacman.y;
      
      // Find direction that maximizes distance from Pac-Man
      let bestDir = validDirs[0];
      let maxDistance = -Infinity;
      
      validDirs.forEach(dir => {
        const testX = ghost.x + dir.x;
        const testY = ghost.y + dir.y;
        const distance = Math.abs(testX - pacman.x) + Math.abs(testY - pacman.y);
        if (distance > maxDistance) {
          maxDistance = distance;
          bestDir = dir;
        }
      });
      
      return bestDir;
    } else {
      // Chase mode - move towards Pac-Man
      const pacman = gameRef.current.pacman;
      const dx = pacman.x - ghost.x;
      const dy = pacman.y - ghost.y;
      
      // Prefer direction that gets closer to Pac-Man
      let bestDir = validDirs[0];
      let minDistance = Infinity;
      
      validDirs.forEach(dir => {
        const testX = ghost.x + dir.x;
        const testY = ghost.y + dir.y;
        const distance = Math.abs(testX - pacman.x) + Math.abs(testY - pacman.y);
        if (distance < minDistance) {
          minDistance = distance;
          bestDir = dir;
        }
      });
      
      return bestDir;
    }
  };

  // Game loop
  useEffect(() => {
    if (!running || !canvasRef.current) return;
    
    let lastUpdate = 0;
    let lastPowerUpdate = 0;
    const moveDelay = 300; // milliseconds between moves - much slower, classic speed
    const powerModeDuration = 10000; // 10 seconds in milliseconds
    
    function draw() {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;
      
      // Clear canvas
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      
      // Draw map
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const cell = gameMapRef.current[y] ? gameMapRef.current[y][x] : 0;
          if (cell === 0) {
            // Wall
            ctx.fillStyle = '#2121de';
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
      if (!pacman || pacman.x === undefined || pacman.y === undefined) {
        return;
      }
      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      const centerX = pacman.x * CELL_SIZE + CELL_SIZE/2;
      const centerY = pacman.y * CELL_SIZE + CELL_SIZE/2;
      const radius = CELL_SIZE/2 - 2;
      
      // Animate mouth opening/closing
      const mouthAngle = (Math.sin(Date.now() / 100) + 1) * 0.4; // 0 to 0.8
      let startAngle = 0;
      let endAngle = Math.PI * 2;
      
      // Determine direction for mouth opening
      if (pacman.dir.x === 1) {
        // Right
        startAngle = mouthAngle / 2;
        endAngle = Math.PI * 2 - mouthAngle / 2;
      } else if (pacman.dir.x === -1) {
        // Left
        startAngle = Math.PI + mouthAngle / 2;
        endAngle = Math.PI - mouthAngle / 2;
      } else if (pacman.dir.y === -1) {
        // Up
        startAngle = Math.PI/2 + mouthAngle / 2;
        endAngle = Math.PI/2 - mouthAngle / 2;
      } else if (pacman.dir.y === 1) {
        // Down
        startAngle = 3*Math.PI/2 + mouthAngle / 2;
        endAngle = 3*Math.PI/2 - mouthAngle / 2;
      } else {
        // Not moving - default to right
        startAngle = mouthAngle / 2;
        endAngle = Math.PI * 2 - mouthAngle / 2;
      }
      
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.lineTo(centerX, centerY);
      ctx.fill();
      
      // Draw ghosts (classic Pac-Man style)
      if (gameRef.current.ghosts && Array.isArray(gameRef.current.ghosts)) {
        gameRef.current.ghosts.forEach(ghost => {
          if (!ghost || ghost.x === undefined || ghost.y === undefined) return;
          
          const x = ghost.x * CELL_SIZE + CELL_SIZE/2;
          const y = ghost.y * CELL_SIZE + CELL_SIZE/2;
          const radius = CELL_SIZE/2 - 2;
          
          ctx.fillStyle = gameRef.current.powerMode ? '#2121ff' : ghost.color;
          
          // Draw ghost body (semi-circle with wavy bottom)
          ctx.beginPath();
          ctx.arc(x, y - radius/2, radius, Math.PI, 0, false);
          
          // Draw wavy bottom
          const waveTime = Date.now() / 200;
          const waveOffset = Math.sin(waveTime) * 2;
          ctx.lineTo(x + radius, y + radius/2);
          ctx.lineTo(x + radius/2, y + radius/2 + waveOffset);
          ctx.lineTo(x, y + radius/2);
          ctx.lineTo(x - radius/2, y + radius/2 + waveOffset);
          ctx.lineTo(x - radius, y + radius/2);
          ctx.lineTo(x - radius, y - radius/2);
          ctx.fill();
          
          // Draw eyes (white circles)
          ctx.fillStyle = '#ffffff';
          const eyeSize = 3;
          const eyeOffsetX = 4;
          const eyeOffsetY = -3;
          
          // Left eye
          ctx.beginPath();
          ctx.arc(x - eyeOffsetX, y + eyeOffsetY, eyeSize, 0, Math.PI * 2);
          ctx.fill();
          
          // Right eye
          ctx.beginPath();
          ctx.arc(x + eyeOffsetX, y + eyeOffsetY, eyeSize, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw pupils (black dots)
          ctx.fillStyle = '#000000';
          const pupilSize = 1.5;
          
          // Determine pupil direction based on ghost direction
          let pupilX1 = x - eyeOffsetX;
          let pupilY1 = y + eyeOffsetY;
          let pupilX2 = x + eyeOffsetX;
          let pupilY2 = y + eyeOffsetY;
          
          if (ghost.dir) {
            if (ghost.dir.x > 0) {
              pupilX1 += 1.5;
              pupilX2 += 1.5;
            } else if (ghost.dir.x < 0) {
              pupilX1 -= 1.5;
              pupilX2 -= 1.5;
            } else if (ghost.dir.y > 0) {
              pupilY1 += 1.5;
              pupilY2 += 1.5;
            } else if (ghost.dir.y < 0) {
              pupilY1 -= 1.5;
              pupilY2 -= 1.5;
            }
          }
          
          // Left pupil
          ctx.beginPath();
          ctx.arc(pupilX1, pupilY1, pupilSize, 0, Math.PI * 2);
          ctx.fill();
          
          // Right pupil
          ctx.beginPath();
          ctx.arc(pupilX2, pupilY2, pupilSize, 0, Math.PI * 2);
          ctx.fill();
        });
      }
      
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
    
    function update(currentTime) {
      if (!running || gameOver) return;
      
      // Safety check - ensure game state is initialized
      if (!gameRef.current.pacman || !gameRef.current.ghosts) {
        draw();
        animationRef.current = requestAnimationFrame(update);
        return;
      }
      
      // Consistent frame timing - only move when enough time has passed
      if (currentTime - lastUpdate < moveDelay) {
        draw();
        animationRef.current = requestAnimationFrame(update);
        return;
      }
      
      lastUpdate = currentTime;
      
      // Update Pac-Man
      const pacman = gameRef.current.pacman;
      if (!pacman || pacman.x === undefined || pacman.y === undefined) {
        draw();
        animationRef.current = requestAnimationFrame(update);
        return;
      }
      
      // Move Pac-Man in current direction
      const dir = pacman.dir || { x: 0, y: 0 };
      const newPos = moveEntity(pacman, dir);
      if (newPos.x !== pacman.x || newPos.y !== pacman.y) {
        pacman.x = newPos.x;
        pacman.y = newPos.y;
        soundManager.pacmanMove();
      }
      
      // After moving (or if we can't move), try to turn in the queued direction
      // This prevents teleporting when keys are held down
      const queuedDir = gameRef.current.nextDir || { x: 0, y: 0 };
      if (queuedDir.x !== 0 || queuedDir.y !== 0) {
        // Only allow direction change if it's different from current direction
        if (queuedDir.x !== pacman.dir.x || queuedDir.y !== pacman.dir.y) {
          const turnTestPos = moveEntity(pacman, queuedDir);
          if (turnTestPos.x !== pacman.x || turnTestPos.y !== pacman.y) {
            pacman.dir = { ...queuedDir };
            gameRef.current.nextDir = { x: 0, y: 0 };
          }
        } else {
          // Clear nextDir if it's the same as current direction
          gameRef.current.nextDir = { x: 0, y: 0 };
        }
      }
      
      // Check for dots
      if (gameMapRef.current[pacman.y] && gameMapRef.current[pacman.y][pacman.x] === 1) {
        soundManager.pacmanEat();
        const newMap = gameMapRef.current.map(row => [...row]);
        newMap[pacman.y][pacman.x] = 3;
        gameMapRef.current = newMap;
        setScore(prev => prev + 10);
      } else if (gameMapRef.current[pacman.y] && gameMapRef.current[pacman.y][pacman.x] === 2) {
        soundManager.pacmanEatPower();
        const newMap = gameMapRef.current.map(row => [...row]);
        newMap[pacman.y][pacman.x] = 3;
        gameMapRef.current = newMap;
        setScore(prev => prev + 50);
        gameRef.current.powerMode = true;
        lastPowerUpdate = currentTime;
      }
      
      // Update power mode (time-based, not frame-based)
      if (gameRef.current.powerMode) {
        if (currentTime - lastPowerUpdate >= powerModeDuration) {
          gameRef.current.powerMode = false;
        }
      }
      
      // Update ghosts (move at same rate as Pac-Man)
      if (gameRef.current.ghosts && Array.isArray(gameRef.current.ghosts)) {
        gameRef.current.ghosts.forEach(ghost => {
          if (!ghost || ghost.x === undefined || ghost.y === undefined) return;
          
          // Check if ghost's current direction is valid, if not, get a new one
          const currentDir = ghost.dir || { x: 0, y: 0 };
          const testPos = moveEntity(ghost, currentDir);
          if (testPos.x === ghost.x && testPos.y === ghost.y) {
            // Ghost is stuck, get a new direction
            ghost.dir = getGhostDirection(ghost);
          } else if (Math.random() < 0.1) {
            // Occasionally change direction even if not stuck (more frequent than before)
            const newDir = getGhostDirection(ghost);
            const newTestPos = moveEntity(ghost, newDir);
            if (newTestPos.x !== ghost.x || newTestPos.y !== ghost.y) {
              ghost.dir = newDir;
            }
          }
          
          // Move ghost
          const newPos = moveEntity(ghost, ghost.dir || { x: 0, y: 0 });
          ghost.x = newPos.x;
          ghost.y = newPos.y;
          
          // Check collision with Pac-Man
          if (ghost.x === pacman.x && ghost.y === pacman.y) {
            if (gameRef.current.powerMode) {
              // Ghost eaten
              ghost.x = 14;
              ghost.y = 12;
              setScore(prev => prev + 200);
            } else {
              // Pac-Man eaten
              soundManager.pacmanDeath();
              setLives(prev => {
                const newLives = prev - 1;
                if (newLives <= 0) {
                  setGameOver(true);
                  setRunning(false);
                } else {
                  // Reset positions
                  pacman.x = 15;
                  pacman.y = 23;
                  pacman.dir = { x: 0, y: 0 };
                  gameRef.current.nextDir = { x: 0, y: 0 };
                  gameRef.current.ghosts.forEach((g, i) => {
                    g.x = 13 + i;
                    g.y = 12;
                  });
                  gameRef.current.powerMode = false;
                }
                return newLives;
              });
            }
          }
        });
      }
      
      // Check win condition
      const dotsLeft = gameMapRef.current.flat().filter(cell => cell === 1 || cell === 2).length;
      if (dotsLeft === 0) {
        setGameOver(true);
        setRunning(false);
      }
      
      draw();
      animationRef.current = requestAnimationFrame(update);
    }
    
    animationRef.current = requestAnimationFrame(update);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [running, gameOver, score, lives]);

  function handleStart() {
    soundManager.buttonClick();
    gameMapRef.current = MAP.map(row => [...row]);
    gameRef.current.pacman = { x: 15, y: 23, dir: { x: 0, y: 0 }, nextDir: { x: 0, y: 0 }, mouth: 0 };
    gameRef.current.nextDir = { x: 0, y: 0 };
    gameRef.current.ghosts = [
      { x: 13, y: 13, dir: { x: -1, y: 0 }, color: '#ff0000' },
      { x: 14, y: 13, dir: { x: 1, y: 0 }, color: '#ffb8ff' },
      { x: 15, y: 13, dir: { x: 0, y: -1 }, color: '#00ffff' },
      { x: 16, y: 13, dir: { x: 0, y: 1 }, color: '#ffb852' }
    ];
    gameRef.current.powerMode = false;
    setScore(0);
    setLives(3);
    setGameOver(false);
    setRunning(true);
  }

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2 style={{ fontFamily: 'monospace', color: '#00ff00', textShadow: '2px 2px #000' }}>Pac-Man</h2>
      <Link 
        to="/"
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
      </Link>
      <div style={{ width: '100%', maxWidth: 600, aspectRatio: '1', marginBottom: 16 }}>
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
        Controls: {isMobile ? 'Touch D-pad below' : 'Arrow Keys or WASD'}
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
            onUp={() => handleTouchDirection({ x: 0, y: -1 })}
            onDown={() => handleTouchDirection({ x: 0, y: 1 })}
            onLeft={() => handleTouchDirection({ x: -1, y: 0 })}
            onRight={() => handleTouchDirection({ x: 1, y: 0 })}
          />
        </div>
      )}
      
      {(!running || gameOver) && (
        <button 
          onClick={handleStart} 
          style={{ 
            fontFamily: 'monospace', 
            fontSize: '1.2rem', 
            background: '#222', 
            color: '#0f0', 
            border: '2px solid #0f0', 
            padding: '8px 16px', 
            cursor: 'pointer' 
          }}
        >
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

