import React, { useRef, useEffect, useState } from 'react';
import soundManager from './sounds';
import { Link } from 'react-router-dom';

const WIDTH = 600;
const HEIGHT = 600;
const CELL_SIZE = 20;
const COLS = WIDTH / CELL_SIZE;
const ROWS = HEIGHT / CELL_SIZE;

function Frogger() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [running, setRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const gameRef = useRef({
    frog: { x: COLS / 2, y: ROWS - 1 },
    vehicles: [],
    logs: [],
    turtles: [],
    homeSpots: [2, 7, 12, 17, 22],
    occupiedHomes: [],
    level: 1,
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

  // Initialize vehicles
  const initializeVehicles = () => {
    const vehicles = [];
    const speeds = [0.5, 0.7, 1, 1.2, 1.5, 1.8, 2];
    const roadLanes = 7; // Total number of lanes
    const roadStart = ROWS - 8;
    const roadEnd = ROWS - 1;
    const numVehicles = 2;
    const half = Math.floor(roadLanes / 2);
    // First road section: all cars go left to right
    for (let lane = 0; lane < half; lane++) {
      const speed = speeds[lane % speeds.length];
      const direction = 1;
      const y = roadStart + lane;
      for (let i = 0; i < numVehicles; i++) {
        vehicles.push({
          x: (i * COLS / numVehicles + Math.random() * 2) % COLS,
          y: y,
          width: 3,
          speed: speed * direction,
          color: `hsl(${Math.random() * 360}, 70%, 50%)`
        });
      }
    }
    // Second road section: all cars go right to left
    for (let lane = half; lane < roadLanes; lane++) {
      const speed = speeds[lane % speeds.length];
      const direction = -1;
      const y = roadStart + lane;
      for (let i = 0; i < numVehicles; i++) {
        vehicles.push({
          x: (i * COLS / numVehicles + Math.random() * 2) % COLS,
          y: y,
          width: 3,
          speed: speed * direction,
          color: `hsl(${Math.random() * 360}, 70%, 50%)`
        });
      }
    }
    gameRef.current.vehicles = vehicles;
    gameRef.current.roadStart = roadStart;
    gameRef.current.roadEnd = roadEnd;
  };

  // Initialize logs
  const initializeLogs = () => {
    const logs = [];
    const speeds = [0.3, 0.5, 0.7, 0.9, 1.1, 0.6, 0.8]; // 7 lanes
    const waterStart = 1;
    const waterEnd = 8;
    // Fewer logs per lane
    for (let lane = 0; lane < 7; lane++) {
      const speed = speeds[lane];
      const direction = lane % 2 === 0 ? 1 : -1;
      const y = waterStart + lane;
      const logWidth = 5;
      const numLogs = 2; // Reduced from Math.ceil(COLS / logWidth) + 1
      for (let i = 0; i < numLogs; i++) {
        logs.push({
          x: (i * COLS / numLogs + Math.random() * 2) % COLS,
          y: y,
          width: logWidth,
          speed: speed * direction
        });
      }
    }
    gameRef.current.logs = logs;
    gameRef.current.waterStart = waterStart;
    gameRef.current.waterEnd = waterEnd;
  };

  // Initialize turtles
  const initializeTurtles = () => {
    const turtles = [];
    const speeds = [0.2, 0.4, 0.6, 0.8, 1]; // Much slower speeds for easier gameplay
    
    // Create turtles for water lanes (increased from 5 to 7 lanes)
    for (let lane = 8; lane < 15; lane++) {
      const speed = speeds[(lane - 8) % 5];
      const direction = lane % 2 === 0 ? 1 : -1;
      const y = ROWS - 2 - lane;
      
      for (let i = 0; i < 2; i++) {
        turtles.push({
          x: (i * COLS / 2 + Math.random() * 100) % COLS,
          y: y,
          width: 2,
          speed: speed * direction,
          diving: false,
          diveTimer: 0
        });
      }
    }
    
    gameRef.current.turtles = turtles;
  };

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      gameRef.current.keys[e.key.toLowerCase()] = true;
      
      if (!running || gameOver) return;
      
      const frog = gameRef.current.frog;
      let newX = frog.x;
      let newY = frog.y;
      
      if (e.key === 'ArrowUp' || e.key === 'w') {
        newY = Math.max(0, frog.y - 1);
        soundManager.froggerJump();
      } else if (e.key === 'ArrowDown' || e.key === 's') {
        newY = Math.min(ROWS - 1, frog.y + 1);
        soundManager.froggerJump();
      } else if (e.key === 'ArrowLeft' || e.key === 'a') {
        newX = Math.max(0, frog.x - 1);
        soundManager.froggerJump();
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        newX = Math.min(COLS - 1, frog.x + 1);
        soundManager.froggerJump();
      }
      
      // Check if move is valid
      if (newX !== frog.x || newY !== frog.y) {
        frog.x = newX;
        frog.y = newY;
        
        // Check if frog reached home
        if (frog.y === 0) {
          const homeIndex = Math.floor(frog.x / 5);
          if (homeIndex >= 0 && homeIndex < 5 && !gameRef.current.occupiedHomes.includes(homeIndex)) {
            gameRef.current.occupiedHomes.push(homeIndex);
            setScore(prev => prev + 100);
            soundManager.froggerHome();
            
            // Reset frog position
            frog.x = COLS / 2;
            frog.y = ROWS - 1;
            
            // Check if all homes are filled
            if (gameRef.current.occupiedHomes.length === 5) {
              gameRef.current.level++;
              gameRef.current.occupiedHomes = [];
              setScore(prev => prev + 500);
              soundManager.froggerLevel();
            }
          }
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
  }, [running, gameOver]);

  // Touch controls
  const handleTouchDirection = (direction) => {
    if (!running || gameOver) return;
    
    const frog = gameRef.current.frog;
    let newX = frog.x;
    let newY = frog.y;
    
    if (direction.x === 0 && direction.y === -1) {
      newY = Math.max(0, frog.y - 1);
    } else if (direction.x === 0 && direction.y === 1) {
      newY = Math.min(ROWS - 1, frog.y + 1);
    } else if (direction.x === -1 && direction.y === 0) {
      newX = Math.max(0, frog.x - 1);
    } else if (direction.x === 1 && direction.y === 0) {
      newX = Math.min(COLS - 1, frog.x + 1);
    }
    
    if (newX !== frog.x || newY !== frog.y) {
      soundManager.froggerJump();
      frog.x = newX;
      frog.y = newY;
      
      // Check if frog reached home
      if (frog.y === 0) {
        const homeIndex = Math.floor(frog.x / 5);
        if (homeIndex >= 0 && homeIndex < 5 && !gameRef.current.occupiedHomes.includes(homeIndex)) {
          gameRef.current.occupiedHomes.push(homeIndex);
          setScore(prev => prev + 100);
          soundManager.froggerHome();
          
          // Reset frog position
          frog.x = COLS / 2;
          frog.y = ROWS - 1;
          
          // Check if all homes are filled
          if (gameRef.current.occupiedHomes.length === 5) {
            gameRef.current.level++;
            gameRef.current.occupiedHomes = [];
            setScore(prev => prev + 500);
            soundManager.froggerLevel();
          }
        }
      }
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

  // Game loop
  useEffect(() => {
    if (!running) return;
    
    let animationId;
    function draw() {
      const ctx = canvasRef.current.getContext('2d');
      
      // Clear canvas
      ctx.fillStyle = '#228B22';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      
      // Draw road
      ctx.fillStyle = '#696969';
      for (let y = gameRef.current.roadStart; y < gameRef.current.roadEnd; y++) {
        ctx.fillRect(0, y * CELL_SIZE, WIDTH, CELL_SIZE);
      }
      
      // Draw water
      ctx.fillStyle = '#4169E1';
      for (let y = gameRef.current.waterStart; y < gameRef.current.waterEnd; y++) {
        ctx.fillRect(0, y * CELL_SIZE, WIDTH, CELL_SIZE);
      }
      
      // Draw home area
      ctx.fillStyle = '#228B22';
      ctx.fillRect(0, 0, WIDTH, CELL_SIZE);
      
      // Draw home spots
      gameRef.current.homeSpots.forEach((x, index) => {
        if (!gameRef.current.occupiedHomes.includes(index)) {
          ctx.fillStyle = '#8B4513';
          ctx.fillRect(x * CELL_SIZE, 0, CELL_SIZE * 3, CELL_SIZE);
        } else {
          ctx.fillStyle = '#00FF00';
          ctx.fillRect(x * CELL_SIZE, 0, CELL_SIZE * 3, CELL_SIZE);
        }
      });
      
      // Draw vehicles
      gameRef.current.vehicles.forEach(vehicle => {
        ctx.fillStyle = vehicle.color;
        ctx.fillRect(vehicle.x * CELL_SIZE, vehicle.y * CELL_SIZE, vehicle.width * CELL_SIZE, CELL_SIZE);
      });
      
      // Draw logs
      gameRef.current.logs.forEach(log => {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(log.x * CELL_SIZE, log.y * CELL_SIZE, log.width * CELL_SIZE, CELL_SIZE);
      });
      
      // Draw turtles
      gameRef.current.turtles.forEach(turtle => {
        if (!turtle.diving) {
          ctx.fillStyle = '#228B22';
          ctx.fillRect(turtle.x * CELL_SIZE, turtle.y * CELL_SIZE, turtle.width * CELL_SIZE, CELL_SIZE);
        }
      });
      
      // Draw frog
      const frog = gameRef.current.frog;
      ctx.fillStyle = '#00FF00';
      ctx.fillRect(frog.x * CELL_SIZE, frog.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      
      // Draw score and lives
      ctx.font = '20px monospace';
      ctx.fillStyle = '#0f0';
      ctx.fillText(`Score: ${score}`, 10, 30);
      ctx.fillText(`Lives: ${lives}`, WIDTH - 100, 30);
      ctx.fillText(`Level: ${gameRef.current.level}`, WIDTH / 2 - 50, 30);
      
      if (gameOver) {
        ctx.font = '32px monospace';
        ctx.fillStyle = '#f00';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2);
      }
    }
    
    function update() {
      // Update vehicles
      gameRef.current.vehicles.forEach(vehicle => {
        vehicle.x += vehicle.speed * 0.1;
        
        // Wrap around screen
        if (vehicle.speed > 0 && vehicle.x > COLS) {
          vehicle.x = -vehicle.width;
        } else if (vehicle.speed < 0 && vehicle.x < -vehicle.width) {
          vehicle.x = COLS;
        }
        
        // Check collision with frog
        const frog = gameRef.current.frog;
        if (frog.y === vehicle.y && 
            frog.x >= vehicle.x && 
            frog.x < vehicle.x + vehicle.width) {
          soundManager.froggerDeath();
          setLives(prev => prev - 1);
          if (lives <= 1) {
            setGameOver(true);
            setRunning(false);
          } else {
            frog.x = COLS / 2;
            frog.y = ROWS - 1;
          }
        }
      });
      
      // Update logs
      gameRef.current.logs.forEach(log => {
        log.x += log.speed * 0.1;
        
        // Wrap around screen
        if (log.speed > 0 && log.x > COLS) {
          log.x = -log.width;
        } else if (log.speed < 0 && log.x < -log.width) {
          log.x = COLS;
        }
      });
      
      // Update turtles
      gameRef.current.turtles.forEach(turtle => {
        turtle.x += turtle.speed * 0.1;
        
        // Wrap around screen
        if (turtle.speed > 0 && turtle.x > COLS) {
          turtle.x = -turtle.width;
        } else if (turtle.speed < 0 && turtle.x < -turtle.width) {
          turtle.x = COLS;
        }
        
        // Diving animation
        turtle.diveTimer++;
        if (turtle.diveTimer > 120) {
          turtle.diving = !turtle.diving;
          turtle.diveTimer = 0;
        }
      });
      
      // Check if frog is on water
      const frog = gameRef.current.frog;
      if (frog.y >= gameRef.current.waterStart && frog.y < gameRef.current.waterEnd) {
        // Check if frog is on a log
        const onLog = gameRef.current.logs.some(log => 
          frog.y === log.y && 
          frog.x >= log.x && 
          frog.x < log.x + log.width
        );
        
        // Check if frog is on a turtle
        const onTurtle = gameRef.current.turtles.some(turtle => 
          !turtle.diving &&
          frog.y === turtle.y && 
          frog.x >= turtle.x && 
          frog.x < turtle.x + turtle.width
        );
        
        if (!onLog && !onTurtle) {
          soundManager.froggerDeath();
          setLives(prev => prev - 1);
          if (lives <= 1) {
            setGameOver(true);
            setRunning(false);
          } else {
            frog.x = COLS / 2;
            frog.y = ROWS - 1;
          }
        } else if (onLog) {
          // Move frog with log
          const log = gameRef.current.logs.find(l => 
            frog.y === l.y && 
            frog.x >= l.x && 
            frog.x < l.x + l.width
          );
          if (log) {
            frog.x += log.speed * 0.1;
          }
        }
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
    initializeVehicles();
    initializeLogs();
    initializeTurtles();
    gameRef.current.frog = { x: COLS / 2, y: ROWS - 1 };
    gameRef.current.occupiedHomes = [];
    gameRef.current.level = 1;
    setScore(0);
    setLives(3);
    setGameOver(false);
    setRunning(true);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2 style={{ fontFamily: 'monospace', color: '#00ff00', textShadow: '2px 2px #000' }}>Frogger</h2>
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

export default Frogger; 