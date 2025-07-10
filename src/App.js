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

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>Retro Games Arcade</h1>
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
              <li><a href="https://my-first-react-app-kej4.vercel.app" target="_blank" rel="noopener noreferrer">Upgraded Snake</a></li>
            </ul>
          </nav>
          <Routes>
            <Route path="/pong" element={<Pong />} />
            <Route path="/snake" element={<Snake />} />
            <Route path="/tic-tac-toe" element={<TicTacToe />} />
            <Route path="/rock-paper-scissors" element={<RockPaperScissors />} />
            <Route path="/simon-says" element={<SimonSays />} />
            <Route path="/2048" element={<Game2048 />} />
            <Route path="/tetris" element={<Tetris />} />
            <Route path="/sidescroller" element={<Sidescroller />} />
            <Route path="/" element={<div>Select a game from the menu!</div>} />
          </Routes>
        </header>
      </div>
    </Router>
  );
}

export default App;
// 