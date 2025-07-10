import React, { useRef, useEffect, useState } from 'react';

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
    ballSpeed: BALL_SPEED
  });

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

  useEffect(() => {
    let animationId;
    const ctx = canvasRef.current.getContext('2d');
    function draw() {
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      // Net
      ctx.strokeStyle = '#0f0';
      ctx.setLineDash([5, 15]);
      ctx.beginPath();
      ctx.moveTo(WIDTH / 2, 0);
      ctx.lineTo(WIDTH / 2, HEIGHT);
      ctx.stroke();
      ctx.setLineDash([]);
      // Paddles
      ctx.fillStyle = '#0f0';
      ctx.fillRect(0, gameRef.current.leftY, PADDLE_WIDTH, PADDLE_HEIGHT);
      ctx.fillRect(WIDTH - PADDLE_WIDTH, gameRef.current.rightY, PADDLE_WIDTH, PADDLE_HEIGHT);
      // Ball
      ctx.fillRect(gameRef.current.ballX, gameRef.current.ballY, BALL_SIZE, BALL_SIZE);
      // Score
      ctx.font = '20px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`Ball Speed: ${gameRef.current.ballSpeed.toFixed(1)}`, 10, HEIGHT - 10);
      ctx.textAlign = 'center';
      ctx.font = '32px monospace';
      ctx.fillText(gameRef.current.leftScore, WIDTH / 4, 40);
      ctx.fillText(gameRef.current.rightScore, WIDTH * 3 / 4, 40);
    }
    function update() {
      // Move paddles based on mode
      if (mode === 0) {
        // 2 Player
        if (gameRef.current.keys['w']) {
          gameRef.current.leftY = Math.max(0, gameRef.current.leftY - PADDLE_SPEED);
        }
        if (gameRef.current.keys['s']) {
          gameRef.current.leftY = Math.min(HEIGHT - PADDLE_HEIGHT, gameRef.current.leftY + PADDLE_SPEED);
        }
        // Player 2 uses I/K
        if (gameRef.current.keys['i']) {
          gameRef.current.rightY = Math.max(0, gameRef.current.rightY - PADDLE_SPEED);
        }
        if (gameRef.current.keys['k']) {
          gameRef.current.rightY = Math.min(HEIGHT - PADDLE_HEIGHT, gameRef.current.rightY + PADDLE_SPEED);
        }
      } else if (mode === 1) {
        // Single Player (Player left, AI right)
        if (gameRef.current.keys['w']) {
          gameRef.current.leftY = Math.max(0, gameRef.current.leftY - PADDLE_SPEED);
        }
        if (gameRef.current.keys['s']) {
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
      }
      // Collisions with paddles
      let hit = false;
      // Left paddle
      if (
        gameRef.current.ballX <= PADDLE_WIDTH &&
        gameRef.current.ballY + BALL_SIZE >= gameRef.current.leftY &&
        gameRef.current.ballY <= gameRef.current.leftY + PADDLE_HEIGHT
      ) {
        gameRef.current.ballVX = Math.sign(gameRef.current.ballVX) * gameRef.current.ballSpeed * -1;
        gameRef.current.ballX = PADDLE_WIDTH; // Prevent sticking
        hit = true;
      }
      // Right paddle
      if (
        gameRef.current.ballX + BALL_SIZE >= WIDTH - PADDLE_WIDTH &&
        gameRef.current.ballY + BALL_SIZE >= gameRef.current.rightY &&
        gameRef.current.ballY <= gameRef.current.rightY + PADDLE_HEIGHT
      ) {
        gameRef.current.ballVX = Math.sign(gameRef.current.ballVX) * gameRef.current.ballSpeed * -1;
        gameRef.current.ballX = WIDTH - PADDLE_WIDTH - BALL_SIZE; // Prevent sticking
        hit = true;
      }
      if (hit) {
        gameRef.current.hitCount = (gameRef.current.hitCount || 0) + 1;
        if (gameRef.current.hitCount % 5 === 0) {
          gameRef.current.ballSpeed += 0.5;
          setBallSpeed(gameRef.current.ballSpeed);
        }
      }
      // Score
      if (gameRef.current.ballX < 0) {
        gameRef.current.rightScore++;
        resetBall(-1);
      } else if (gameRef.current.ballX > WIDTH) {
        gameRef.current.leftScore++;
        resetBall(1);
      }
    }
    function resetBall(dir) {
      gameRef.current.ballX = WIDTH / 2 - BALL_SIZE / 2;
      gameRef.current.ballY = HEIGHT / 2 - BALL_SIZE / 2;
      gameRef.current.ballVX = gameRef.current.ballSpeed * dir;
      gameRef.current.ballVY = gameRef.current.ballSpeed * (Math.random() > 0.5 ? 1 : -1);
      gameRef.current.hitCount = 0;
      gameRef.current.ballSpeed = BALL_SPEED;
      setBallSpeed(BALL_SPEED);
    }
    function loop() {
      update();
      draw();
      animationId = requestAnimationFrame(loop);
    }
    loop();
    return () => cancelAnimationFrame(animationId);
  }, [mode]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2 style={{ fontFamily: 'monospace', color: '#00ff00', textShadow: '2px 2px #000' }}>Pong</h2>
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        style={{ border: '4px solid #0f0', background: '#111', marginBottom: 16 }}
      />
      <div style={{ color: '#0f0', fontFamily: 'monospace', marginBottom: 8 }}>
        Controls: W/S (Left Paddle), {mode === 0 ? 'I/K (Right Paddle)' : 'Up/Down (Right Paddle)'} | Press 'M' to change mode
      </div>
      <div style={{ color: '#0f0', fontFamily: 'monospace', marginBottom: 8 }}>
        Mode: <b>{modeName}</b> - {modeDesc}
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
        {MODES.map((m, idx) => (
          <button
            key={m.name}
            onClick={() => setMode(idx)}
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
    </div>
  );
}

export default Pong; 