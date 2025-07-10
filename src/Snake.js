import React, { useRef, useEffect, useState } from 'react';

const WIDTH = 400;
const HEIGHT = 400;
const SCALE = 20;
const ROWS = HEIGHT / SCALE;
const COLS = WIDTH / SCALE;
const INIT_SNAKE = [
  { x: 8, y: 10 },
  { x: 7, y: 10 },
  { x: 6, y: 10 }
];
const INIT_DIR = { x: 1, y: 0 };

function Snake() {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [running, setRunning] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const gameRef = useRef({
    snake: [...INIT_SNAKE],
    dir: { ...INIT_DIR },
    food: { x: 12, y: 10 },
    alive: true,
    pendingDir: null
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
      let d = null;
      if (e.key.toLowerCase() === 'w') d = { x: 0, y: -1 };
      if (e.key.toLowerCase() === 's') d = { x: 0, y: 1 };
      if (e.key.toLowerCase() === 'a') d = { x: -1, y: 0 };
      if (e.key.toLowerCase() === 'd') d = { x: 1, y: 0 };
      if (d) {
        // Prevent reversing
        const { x, y } = gameRef.current.dir;
        if (d.x !== -x && d.y !== -y) {
          gameRef.current.pendingDir = d;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Touch controls
  const handleTouchDirection = (direction) => {
    let d = null;
    if (direction === 'up') d = { x: 0, y: -1 };
    if (direction === 'down') d = { x: 0, y: 1 };
    if (direction === 'left') d = { x: -1, y: 0 };
    if (direction === 'right') d = { x: 1, y: 0 };
    if (d) {
      // Prevent reversing
      const { x, y } = gameRef.current.dir;
      if (d.x !== -x && d.y !== -y) {
        gameRef.current.pendingDir = d;
      }
    }
  };

  useEffect(() => {
    if (!running) return;
    const ctx = canvasRef.current.getContext('2d');
    let intervalId;
    function draw() {
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      // Draw food
      ctx.fillStyle = '#ff0';
      ctx.fillRect(gameRef.current.food.x * SCALE, gameRef.current.food.y * SCALE, SCALE, SCALE);
      // Draw snake
      ctx.fillStyle = '#0f0';
      for (const s of gameRef.current.snake) {
        ctx.fillRect(s.x * SCALE, s.y * SCALE, SCALE, SCALE);
      }
      // Score
      ctx.font = '20px monospace';
      ctx.fillStyle = '#0f0';
      ctx.textAlign = 'left';
      ctx.fillText('Score: ' + score, 10, 30);
      if (!gameRef.current.alive) {
        ctx.font = '32px monospace';
        ctx.fillStyle = '#f00';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', WIDTH / 2, HEIGHT / 2);
      }
    }
    function update() {
      if (!gameRef.current.alive) return;
      // Direction update
      if (gameRef.current.pendingDir) {
        gameRef.current.dir = gameRef.current.pendingDir;
        gameRef.current.pendingDir = null;
      }
      const head = { ...gameRef.current.snake[0] };
      head.x += gameRef.current.dir.x;
      head.y += gameRef.current.dir.y;
      // Wall wrapping
      if (head.x < 0) head.x = COLS - 1;
      if (head.x >= COLS) head.x = 0;
      if (head.y < 0) head.y = ROWS - 1;
      if (head.y >= ROWS) head.y = 0;
      // Self collision
      for (const s of gameRef.current.snake) {
        if (s.x === head.x && s.y === head.y) {
          gameRef.current.alive = false;
          setRunning(false);
          return;
        }
      }
      // Food collision
      let ate = false;
      if (head.x === gameRef.current.food.x && head.y === gameRef.current.food.y) {
        ate = true;
        setScore((s) => s + 1);
        // Place new food
        let newFood;
        do {
          newFood = {
            x: Math.floor(Math.random() * COLS),
            y: Math.floor(Math.random() * ROWS)
          };
        } while (gameRef.current.snake.some((s) => s.x === newFood.x && s.y === newFood.y));
        gameRef.current.food = newFood;
      }
      // Move snake
      gameRef.current.snake.unshift(head);
      if (!ate) {
        gameRef.current.snake.pop();
      }
    }
    function gameLoop() {
      update();
      draw();
    }
    intervalId = setInterval(gameLoop, 100);
    return () => clearInterval(intervalId);
  }, [score, running]);

  function handleStart() {
    gameRef.current.snake = [...INIT_SNAKE];
    gameRef.current.dir = { ...INIT_DIR };
    gameRef.current.food = { x: 12, y: 10 };
    gameRef.current.alive = true;
    gameRef.current.pendingDir = null;
    setScore(0);
    setRunning(true);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2 style={{ fontFamily: 'monospace', color: '#00ff00', textShadow: '2px 2px #000' }}>Snake</h2>
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        style={{ border: '4px solid #0f0', background: '#111', marginBottom: 16 }}
      />
      <div style={{ color: '#0f0', fontFamily: 'monospace', marginBottom: 8 }}>
        Controls: W/A/S/D
      </div>
      {(!running || !gameRef.current.alive) && (
        <button onClick={handleStart} style={{ fontFamily: 'monospace', fontSize: '1.2rem', background: '#222', color: '#0f0', border: '2px solid #0f0', padding: '8px 16px', cursor: 'pointer' }}>
          {score === 0 ? 'Start' : 'Restart'}
        </button>
      )}
      
      {/* Touch Controls for Mobile */}
      {isMobile && running && gameRef.current.alive && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: 8, 
          marginTop: 16,
          width: 200
        }}>
          <div></div>
          <button
            onClick={() => handleTouchDirection('up')}
            style={{
              width: 60,
              height: 60,
              fontSize: '1.5rem',
              background: '#222',
              color: '#0f0',
              border: '2px solid #0f0',
              borderRadius: '50%',
              cursor: 'pointer',
              fontFamily: 'monospace'
            }}
          >
            ↑
          </button>
          <div></div>
          
          <button
            onClick={() => handleTouchDirection('left')}
            style={{
              width: 60,
              height: 60,
              fontSize: '1.5rem',
              background: '#222',
              color: '#0f0',
              border: '2px solid #0f0',
              borderRadius: '50%',
              cursor: 'pointer',
              fontFamily: 'monospace'
            }}
          >
            ←
          </button>
          <div></div>
          <button
            onClick={() => handleTouchDirection('right')}
            style={{
              width: 60,
              height: 60,
              fontSize: '1.5rem',
              background: '#222',
              color: '#0f0',
              border: '2px solid #0f0',
              borderRadius: '50%',
              cursor: 'pointer',
              fontFamily: 'monospace'
            }}
          >
            →
          </button>
          
          <div></div>
          <button
            onClick={() => handleTouchDirection('down')}
            style={{
              width: 60,
              height: 60,
              fontSize: '1.5rem',
              background: '#222',
              color: '#0f0',
              border: '2px solid #0f0',
              borderRadius: '50%',
              cursor: 'pointer',
              fontFamily: 'monospace'
            }}
          >
            ↓
          </button>
          <div></div>
        </div>
      )}
    </div>
  );
}

export default Snake; 