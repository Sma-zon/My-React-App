// Sound utilities for retro games
class SoundManager {
  constructor() {
    this.audioContext = null;
    this.sounds = {};
    this.enabled = true;
    this.init();
  }

  init() {
    try {
      // Check if audio context is already created
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
    } catch (e) {
      console.log('Web Audio API not supported');
      this.enabled = false;
    }
  }

  // Resume audio context if suspended
  resumeContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  // Generate a beep sound
  beep(frequency = 440, duration = 0.1, type = 'square') {
    if (!this.enabled || !this.audioContext) return;
    
    this.resumeContext();
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // Generate a sweep sound (for power-ups, level completion)
  sweep(startFreq = 200, endFreq = 800, duration = 0.3) {
    if (!this.enabled || !this.audioContext) return;
    
    this.resumeContext();
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    oscillator.frequency.setValueAtTime(startFreq, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(endFreq, this.audioContext.currentTime + duration);
    oscillator.type = 'sawtooth';
    
    gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // Generate a noise sound (for explosions, game over)
  noise(duration = 0.2) {
    if (!this.enabled || !this.audioContext) return;
    
    this.resumeContext();
    
    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    
    const whiteNoise = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    
    whiteNoise.buffer = buffer;
    whiteNoise.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
    
    whiteNoise.start(this.audioContext.currentTime);
    whiteNoise.stop(this.audioContext.currentTime + duration);
  }

  // Game-specific sound effects
  pongHit() {
    this.beep(300, 0.05, 'square');
  }

  pongScore() {
    this.sweep(400, 800, 0.2);
  }

  snakeEat() {
    this.beep(600, 0.1, 'sine');
  }

  snakeGameOver() {
    this.noise(0.3);
    setTimeout(() => this.beep(200, 0.2, 'sawtooth'), 100);
  }

  ticTacToeClick() {
    this.beep(400, 0.08, 'triangle');
  }

  ticTacToeWin() {
    this.sweep(300, 1000, 0.4);
  }

  rpsChoice() {
    this.beep(500, 0.1, 'sine');
  }

  rpsWin() {
    this.sweep(400, 800, 0.3);
  }

  rpsLose() {
    this.beep(200, 0.2, 'sawtooth');
  }

  simonButton() {
    this.beep(400, 0.15, 'sine');
  }

  simonSequence() {
    this.beep(600, 0.1, 'triangle');
  }

  simonGameOver() {
    this.noise(0.2);
    setTimeout(() => this.beep(150, 0.3, 'sawtooth'), 100);
  }

  game2048Move() {
    this.beep(300, 0.05, 'square');
  }

  game2048Merge() {
    this.sweep(400, 700, 0.2);
  }

  game2048GameOver() {
    this.noise(0.3);
    setTimeout(() => this.beep(200, 0.2, 'sawtooth'), 150);
  }

  tetrisMove() {
    this.beep(200, 0.03, 'square');
  }

  tetrisRotate() {
    this.beep(300, 0.05, 'triangle');
  }

  tetrisLineClear() {
    this.sweep(300, 800, 0.3);
  }

  tetrisGameOver() {
    this.noise(0.4);
    setTimeout(() => this.beep(150, 0.3, 'sawtooth'), 200);
  }

  sidescrollerJump() {
    this.beep(400, 0.1, 'sine');
  }

  sidescrollerScore() {
    this.beep(600, 0.08, 'triangle');
  }

  sidescrollerGameOver() {
    this.noise(0.3);
    setTimeout(() => this.beep(200, 0.2, 'sawtooth'), 100);
  }

  buttonClick() {
    this.beep(500, 0.05, 'square');
  }

  // Minesweeper sounds
  minesweeperReveal() {
    this.beep(400, 0.1, 'sine');
  }

  minesweeperFlag() {
    this.beep(600, 0.08, 'triangle');
  }

  minesweeperUnflag() {
    this.beep(500, 0.08, 'triangle');
  }

  minesweeperExplosion() {
    this.noise(0.4);
    setTimeout(() => this.beep(150, 0.3, 'sawtooth'), 100);
    setTimeout(() => this.beep(100, 0.2, 'square'), 300);
  }

  minesweeperWin() {
    this.sweep(300, 1000, 0.5);
    setTimeout(() => this.sweep(500, 800, 0.3), 200);
  }

  // Battleship sounds
  battleshipPlace() {
    this.beep(300, 0.1, 'square');
  }

  battleshipHit() {
    this.beep(200, 0.2, 'sawtooth');
  }

  battleshipMiss() {
    this.beep(400, 0.1, 'sine');
  }

  battleshipSunk() {
    this.sweep(200, 600, 0.4);
  }

  battleshipWin() {
    this.sweep(400, 800, 0.5);
    setTimeout(() => this.sweep(300, 1000, 0.4), 200);
  }

  battleshipLose() {
    this.noise(0.3);
    setTimeout(() => this.beep(150, 0.3, 'sawtooth'), 100);
  }

  // Breakout sounds
  breakoutWall() {
    this.beep(300, 0.05, 'square');
  }

  breakoutPaddle() {
    this.beep(400, 0.1, 'sine');
  }

  breakoutBrick() {
    this.beep(600, 0.08, 'triangle');
  }

  breakoutLoseLife() {
    this.beep(200, 0.2, 'sawtooth');
  }

  breakoutWin() {
    this.sweep(400, 800, 0.5);
    setTimeout(() => this.sweep(300, 1000, 0.4), 200);
  }

  // Pac-Man sounds
  pacmanMove() {
    this.beep(200, 0.05, 'square');
  }

  pacmanEat() {
    this.beep(400, 0.1, 'sine');
  }

  pacmanEatPower() {
    this.sweep(300, 600, 0.3);
  }

  pacmanDeath() {
    this.noise(0.5);
    setTimeout(() => this.beep(150, 0.4, 'sawtooth'), 200);
  }

  // Frogger sounds
  froggerJump() {
    this.beep(300, 0.1, 'sine');
  }

  froggerCross() {
    this.beep(500, 0.15, 'triangle');
  }

  froggerDeath() {
    this.noise(0.3);
    setTimeout(() => this.beep(200, 0.2, 'sawtooth'), 100);
  }

  froggerHome() {
    this.sweep(400, 800, 0.3);
  }

  froggerLevel() {
    this.sweep(300, 1000, 0.5);
    setTimeout(() => this.sweep(500, 800, 0.3), 200);
  }

  // Sudoku sounds
  sudokuPlace() {
    this.beep(400, 0.08, 'sine');
  }

  sudokuError() {
    this.beep(200, 0.2, 'sawtooth');
  }

  sudokuComplete() {
    this.sweep(300, 800, 0.5);
  }

  // Memory Match sounds
  memoryFlip() {
    this.beep(300, 0.1, 'sine');
  }

  memoryMatch() {
    this.sweep(400, 700, 0.3);
  }

  memoryMismatch() {
    this.beep(200, 0.15, 'sawtooth');
  }

  // Word Search sounds
  wordSearchSelect() {
    this.beep(400, 0.08, 'sine');
  }

  wordSearchFound() {
    this.sweep(500, 800, 0.3);
  }

  // Connect Four sounds
  connectFourDrop() {
    this.beep(300, 0.1, 'square');
  }

  connectFourWin() {
    this.sweep(400, 800, 0.5);
  }

  // Flappy Bird sounds
  flappyJump() {
    this.beep(400, 0.1, 'sine');
  }

  flappyScore() {
    this.beep(600, 0.08, 'triangle');
  }

  flappyDeath() {
    this.noise(0.3);
    setTimeout(() => this.beep(200, 0.2, 'sawtooth'), 100);
  }

  // Platformer sounds
  platformerJump() {
    this.beep(300, 0.1, 'sine');
  }

  platformerCollect() {
    this.beep(500, 0.08, 'triangle');
  }

  platformerDeath() {
    this.noise(0.3);
    setTimeout(() => this.beep(200, 0.2, 'sawtooth'), 100);
  }

  // Flappy Bird sounds
  flappyJump() {
    this.beep(400, 0.1, 'sine');
  }

  flappyScore() {
    this.beep(600, 0.08, 'triangle');
  }

  flappyDeath() {
    this.noise(0.3);
    setTimeout(() => this.beep(200, 0.2, 'sawtooth'), 100);
  }

  toggleSound() {
    this.enabled = !this.enabled;
    if (this.enabled && this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}

// Create a global sound manager instance
const soundManager = new SoundManager();

export default soundManager; 