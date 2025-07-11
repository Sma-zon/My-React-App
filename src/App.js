import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Pong from './Pong';
import Snake from './Snake';
import TicTacToe from './TicTacToe';
import RockPaperScissors from './RockPaperScissors';
import SimonSays from './SimonSays';
import Game2048 from './Game2048';
import Tetris from './Tetris';
import Sidescroller from './Sidescroller';
import Minesweeper from './Minesweeper';
import Battleship from './Battleship';
import Breakout from './Breakout';
import Frogger from './Frogger';
import Sudoku from './Sudoku';
import MemoryMatch from './MemoryMatch';
import WordSearch from './WordSearch';
import ConnectFour from './ConnectFour';
import FlappyBird from './FlappyBird';
import soundManager from './sounds';
import { useState } from 'react';

function App() {
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

  const toggleSound = () => {
    setIsSoundEnabled(!isSoundEnabled);
    soundManager.toggleSound();
  };

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1 style={{ fontFamily: 'monospace', color: '#00ff00', textShadow: '2px 2px #000' }}>Fun Retro Games</h1>
          <nav>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li><Link to="/pong">Pong</Link></li>
              <li><Link to="/snake">Snake</Link></li>
              <li><Link to="/tic-tac-toe">Tic-Tac-Toe</Link></li>
              <li><Link to="/rock-paper-scissors">Rock Paper Scissors</Link></li>
              <li><Link to="/simon-says">Simon Says</Link></li>
              <li><Link to="/2048">2048</Link></li>
              <li><Link to="/tetris">Tetris</Link></li>
              <li><Link to="/sidescroller">Mini Sidescroller</Link></li>
              <li><Link to="/minesweeper">Minesweeper</Link></li>
              <li><Link to="/battleship">Battleship</Link></li>
              <li><Link to="/breakout">Breakout</Link></li>
              <li><Link to="/frogger">Frogger</Link></li>
              <li><Link to="/sudoku">Sudoku</Link></li>
              <li><Link to="/memory-match">Memory Match</Link></li>
              <li><Link to="/word-search">Word Search</Link></li>
              <li><Link to="/connect-four">Connect Four</Link></li>
              <li><Link to="/flappy-bird">Flappy Bird</Link></li>
              <li><a href="https://my-first-react-app-kej4.vercel.app" target="_blank" rel="noopener noreferrer">Upgraded Snake</a></li>
            </ul>
          </nav>
          <div style={{ marginTop: 20 }}>
            <button 
              onClick={toggleSound}
              style={{
                fontFamily: 'monospace',
                fontSize: '1rem',
                background: '#111',
                color: '#0f0',
                border: '2px solid #0f0',
                padding: '8px 16px',
                cursor: 'pointer',
                borderRadius: '4px'
              }}
            >
              {isSoundEnabled ? '🔊 Disable Sound' : '🔇 Enable Sound'}
            </button>
          </div>
          <Routes>
            <Route path="/pong" element={<Pong />} />
            <Route path="/snake" element={<Snake />} />
            <Route path="/tic-tac-toe" element={<TicTacToe />} />
            <Route path="/rock-paper-scissors" element={<RockPaperScissors />} />
            <Route path="/simon-says" element={<SimonSays />} />
            <Route path="/2048" element={<Game2048 />} />
            <Route path="/tetris" element={<Tetris />} />
            <Route path="/sidescroller" element={<Sidescroller />} />
            <Route path="/minesweeper" element={<Minesweeper />} />
            <Route path="/battleship" element={<Battleship />} />
            <Route path="/breakout" element={<Breakout />} />
            <Route path="/frogger" element={<Frogger />} />
            <Route path="/sudoku" element={<Sudoku />} />
            <Route path="/memory-match" element={<MemoryMatch />} />
            <Route path="/word-search" element={<WordSearch />} />
            <Route path="/connect-four" element={<ConnectFour />} />
            <Route path="/flappy-bird" element={<FlappyBird />} />
            <Route path="/" element={<div>Select a game from the menu!</div>} />
          </Routes>
        </header>
      </div>
    </Router>
  );
}

export default App;
// hi