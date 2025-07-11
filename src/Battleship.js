import React, { useState, useEffect, useRef } from 'react';
import soundManager from './sounds';
import { Link } from 'react-router-dom';

const BOARD_SIZE = 10;
const SHIPS = [
  { name: 'Carrier', size: 5 },
  { name: 'Battleship', size: 4 },
  { name: 'Cruiser', size: 3 },
  { name: 'Submarine', size: 3 },
  { name: 'Destroyer', size: 2 }
];

function Battleship() {
  const [mode, setMode] = useState(0); // 0: Single Player, 1: Two Player
  const [gamePhase, setGamePhase] = useState('setup'); // setup, playing, gameOver
  const [currentPlayer, setCurrentPlayer] = useState(0); // 0: Player, 1: AI/Player2
  const [playerBoard, setPlayerBoard] = useState([]);
  const [enemyBoard, setEnemyBoard] = useState([]);
  const [playerShips, setPlayerShips] = useState([]);
  const [enemyShips, setEnemyShips] = useState([]);
  const [selectedShip, setSelectedShip] = useState(0);
  const [shipOrientation, setShipOrientation] = useState('horizontal');
  const [playerScore, setPlayerScore] = useState(0);
  const [enemyScore, setEnemyScore] = useState(0);
  const [winner, setWinner] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize boards
  const initializeBoards = () => {
    const emptyBoard = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(0));
    setPlayerBoard(emptyBoard);
    setEnemyBoard(emptyBoard);
    setPlayerShips([]);
    setEnemyShips([]);
    setPlayerScore(0);
    setEnemyScore(0);
    setWinner(null);
    setGamePhase('setup');
    setCurrentPlayer(0);
    setSelectedShip(0);
    setShipOrientation('horizontal');
    setSetupComplete(false);
  };

  // Place ship on board
  const placeShip = (board, ships, row, col, shipIndex, orientation) => {
    const ship = SHIPS[shipIndex];
    const newBoard = board.map(row => [...row]);
    const newShips = [...ships];
    
    // Check if placement is valid
    for (let i = 0; i < ship.size; i++) {
      const r = orientation === 'horizontal' ? row : row + i;
      const c = orientation === 'horizontal' ? col + i : col;
      
      if (r >= BOARD_SIZE || c >= BOARD_SIZE || newBoard[r][c] !== 0) {
        return false;
      }
    }
    
    // Place ship
    for (let i = 0; i < ship.size; i++) {
      const r = orientation === 'horizontal' ? row : row + i;
      const c = orientation === 'horizontal' ? col + i : col;
      newBoard[r][c] = shipIndex + 1;
    }
    
    newShips.push({ ...ship, row, col, orientation, sunk: false });
    return { board: newBoard, ships: newShips };
  };

  // Handle ship placement during setup
  const handleSetupClick = (row, col) => {
    if (gamePhase !== 'setup') return;
    
    // Handle player 1 setup
    if (currentPlayer === 0) {
      const result = placeShip(playerBoard, playerShips, row, col, selectedShip, shipOrientation);
      if (result) {
        soundManager.battleshipPlace();
        setPlayerBoard(result.board);
        setPlayerShips(result.ships);
        
        if (selectedShip < SHIPS.length - 1) {
          setSelectedShip(selectedShip + 1);
        } else {
          // Setup complete for player 1
          if (mode === 0) {
            // Single player - generate AI board
            generateAIBoard();
            setGamePhase('playing');
          } else {
            // Two player - switch to player 2
            setCurrentPlayer(1);
            setSelectedShip(0);
            setSetupComplete(true);
          }
        }
      }
    }
    // Handle player 2 setup
    else if (currentPlayer === 1 && mode === 1) {
      const result = placeShip(enemyBoard, enemyShips, row, col, selectedShip, shipOrientation);
      if (result) {
        soundManager.battleshipPlace();
        setEnemyBoard(result.board);
        setEnemyShips(result.ships);
        
        if (selectedShip < SHIPS.length - 1) {
          setSelectedShip(selectedShip + 1);
        } else {
          // Setup complete for player 2
          setGamePhase('playing');
          setCurrentPlayer(0);
        }
      }
    }
  };

  // Generate AI board for single player
  const generateAIBoard = () => {
    let aiBoard = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(0));
    let aiShips = [];
    
    SHIPS.forEach((ship, shipIndex) => {
      let placed = false;
      while (!placed) {
        const row = Math.floor(Math.random() * BOARD_SIZE);
        const col = Math.floor(Math.random() * BOARD_SIZE);
        const orientation = Math.random() > 0.5 ? 'horizontal' : 'vertical';
        
        const result = placeShip(aiBoard, aiShips, row, col, shipIndex, orientation);
        if (result) {
          aiBoard = result.board;
          aiShips = result.ships;
          placed = true;
        }
      }
    });
    
    setEnemyBoard(aiBoard);
    setEnemyShips(aiShips);
  };

  // AI move for single player
  const makeAIMove = () => {
    if (gamePhase !== 'playing' || currentPlayer !== 1) return;
    
    let row, col;
    do {
      row = Math.floor(Math.random() * BOARD_SIZE);
      col = Math.floor(Math.random() * BOARD_SIZE);
    } while (playerBoard[row][col] === -1 || playerBoard[row][col] === -2);
    
    // Simulate AI attack
    const newBoard = playerBoard.map(row => [...row]);
    const newShips = [...playerShips];
    
    if (newBoard[row][col] > 0) {
      soundManager.battleshipHit();
      // Get the ship index BEFORE modifying the board
      const shipIndex = newBoard[row][col] - 1;
      newBoard[row][col] = -1;
      // Check if ship is sunk
      const ship = newShips[shipIndex];
      if (ship && !ship.sunk) {
        let sunk = true;
        for (let i = 0; i < ship.size; i++) {
          const r = ship.orientation === 'horizontal' ? ship.row : ship.row + i;
          const c = ship.orientation === 'horizontal' ? ship.col + i : ship.col;
          if (newBoard[r][c] !== -1) {
            sunk = false;
            break;
          }
        }
        if (sunk) {
          soundManager.battleshipSunk();
          newShips[shipIndex].sunk = true;
        }
      }
      setEnemyScore(prev => prev + 1);
      setPlayerBoard(newBoard); // Show hit marker
      setPlayerShips(newShips);
      // Check for game over
      const allShipsSunk = newShips.every(ship => ship.sunk);
      if (allShipsSunk) {
        setWinner('Enemy');
        setGamePhase('gameOver');
        soundManager.battleshipLose();
        return;
      }
    } else {
      soundManager.battleshipMiss();
      newBoard[row][col] = -2;
      setPlayerBoard(newBoard);
    }
    // Always return turn to player after AI move
    setTimeout(() => {
      setCurrentPlayer(0);
    }, 700);
  };

  // In handleAttack, always switch turns after a move (no extra turn for hit)
  const handleAttack = (row, col) => {
    if (gamePhase !== 'playing') return;
    // In single player, only player 0 can attack
    if (mode === 0 && currentPlayer !== 0) return;
    // In two player, allow both players to attack
    if (mode === 1 && currentPlayer !== 0 && currentPlayer !== 1) return;
    const targetBoard = currentPlayer === 0 ? enemyBoard : playerBoard;
    const targetShips = currentPlayer === 0 ? enemyShips : playerShips;
    if (targetBoard[row][col] === -1 || targetBoard[row][col] === -2) return; // Already hit
    const newBoard = targetBoard.map(row => [...row]);
    const newShips = [...targetShips];
    if (newBoard[row][col] > 0) {
      // Hit!
      soundManager.battleshipHit();
      // Get the ship index BEFORE modifying the board
      const shipIndex = newBoard[row][col] - 1;
      newBoard[row][col] = -1; // Hit marker
      // Check if ship is sunk
      const ship = newShips[shipIndex];
      if (ship && !ship.sunk) {
        let sunk = true;
        for (let i = 0; i < ship.size; i++) {
          const r = ship.orientation === 'horizontal' ? ship.row : ship.row + i;
          const c = ship.orientation === 'horizontal' ? ship.col + i : ship.col;
          if (newBoard[r][c] !== -1) {
            sunk = false;
            break;
          }
        }
        if (sunk) {
          soundManager.battleshipSunk();
          newShips[shipIndex].sunk = true;
        }
      }
      if (currentPlayer === 0) {
        setPlayerScore(prev => prev + 1);
        setEnemyBoard(newBoard);
        setEnemyShips(newShips);
      } else {
        setEnemyScore(prev => prev + 1);
        setPlayerBoard(newBoard);
        setPlayerShips(newShips);
      }
    } else {
      // Miss
      soundManager.battleshipMiss();
      newBoard[row][col] = -2; // Miss marker
      if (currentPlayer === 0) {
        setEnemyBoard(newBoard);
      } else {
        setPlayerBoard(newBoard);
      }
    }
    // Check for game over
    const allShipsSunk = newShips.every(ship => ship.sunk);
    if (allShipsSunk) {
      setWinner(currentPlayer === 0 ? 'Player 1' : 'Player 2');
      setGamePhase('gameOver');
      if (currentPlayer === 0) {
        soundManager.battleshipWin();
      } else {
        soundManager.battleshipLose();
      }
      return;
    }
    // Switch turns after a short delay so player can see the result
    setTimeout(() => {
      if (mode === 0) {
        setCurrentPlayer(1); // AI's turn
      } else {
        setCurrentPlayer(currentPlayer === 0 ? 1 : 0); // Alternate turns
      }
    }, 700);
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

  // Initialize game on first load
  useEffect(() => {
    initializeBoards();
  }, []);

  // After setCurrentPlayer(1) in single player mode, trigger AI move with useEffect
  useEffect(() => {
    if (mode === 0 && gamePhase === 'playing' && currentPlayer === 1) {
      setTimeout(() => {
        makeAIMove();
      }, 700);
    }
  }, [mode, gamePhase, currentPlayer]);

  // Update renderCell to accept a showShips argument
  const renderCell = (board, row, col, showShips = false, onClick = null) => {
    const cellValue = board[row][col];
    let cellContent = '';
    let cellStyle = {
      width: 25,
      height: 25,
      border: '1px solid #0f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'monospace',
      fontSize: '12px',
      cursor: onClick ? 'pointer' : 'default',
      userSelect: 'none'
    };
    
    if (cellValue === -1) {
      // Hit
      cellContent = '💥';
      cellStyle.background = '#f00';
      cellStyle.color = '#fff';
    } else if (cellValue === -2) {
      // Miss
      cellContent = '💧';
      cellStyle.background = '#00f';
      cellStyle.color = '#fff';
    } else if (cellValue > 0) {
      // Ship
      if (showShips) {
        cellContent = '🚢';
        cellStyle.background = '#0f0';
        cellStyle.color = '#000';
      } else {
        cellContent = '';
        cellStyle.background = '#111';
        cellStyle.color = '#0f0';
      }
    } else {
      // Empty
      cellContent = '';
      cellStyle.background = '#111';
      cellStyle.color = '#0f0';
    }
    
    return (
      <div
        key={`${row}-${col}`}
        style={cellStyle}
        onClick={() => onClick && onClick(row, col)}
      >
        {cellContent}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h2 style={{ fontFamily: 'monospace', color: '#00ff00', textShadow: '2px 2px #000' }}>Battleship</h2>
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
      
      {/* Mode Selection */}
      {gamePhase === 'setup' && currentPlayer === 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ color: '#0f0', fontFamily: 'monospace', marginBottom: 8 }}>
            Select Mode:
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => {
                soundManager.buttonClick();
                setMode(0);
              }}
              style={{
                fontFamily: 'monospace',
                fontSize: '1rem',
                color: mode === 0 ? '#111' : '#0f0',
                background: mode === 0 ? '#0f0' : '#111',
                border: '2px solid #0f0',
                padding: '6px 16px',
                cursor: 'pointer'
              }}
            >
              Single Player
            </button>
            <button
              onClick={() => {
                soundManager.buttonClick();
                setMode(1);
              }}
              style={{
                fontFamily: 'monospace',
                fontSize: '1rem',
                color: mode === 1 ? '#111' : '#0f0',
                background: mode === 1 ? '#0f0' : '#111',
                border: '2px solid #0f0',
                padding: '6px 16px',
                cursor: 'pointer'
              }}
            >
              Two Player
            </button>
          </div>
        </div>
      )}
      
      {/* Game Info */}
      <div style={{ color: '#0f0', fontFamily: 'monospace', marginBottom: 8 }}>
        {gamePhase === 'setup' ? (
          `Player ${currentPlayer + 1} Setup - Place ${SHIPS[selectedShip]?.name}`
        ) : (
          `Player: ${playerScore} | Enemy: ${enemyScore} | Turn: ${currentPlayer === 0 ? 'Player' : 'Enemy'}`
        )}
      </div>
      
      {/* Setup Controls */}
      {gamePhase === 'setup' && (
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={() => {
              soundManager.buttonClick();
              setShipOrientation(shipOrientation === 'horizontal' ? 'vertical' : 'horizontal');
            }}
            style={{
              fontFamily: 'monospace',
              fontSize: '1rem',
              background: '#222',
              color: '#0f0',
              border: '2px solid #0f0',
              padding: '6px 16px',
              cursor: 'pointer',
              marginRight: 8
            }}
          >
            {shipOrientation === 'horizontal' ? 'Horizontal' : 'Vertical'}
          </button>
        </div>
      )}
      
      {/* Game Boards */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        {/* During Player 2 setup, show Player 2's board on the right and Player 1's on the left, otherwise normal order */}
        {mode === 1 && gamePhase === 'setup' && currentPlayer === 1 ? (
          <>
            {/* Player 1's Board (hidden) */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: '#0f0', fontFamily: 'monospace', marginBottom: 4 }}>
                Player 1's Waters (Hidden)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`, gap: 2 }}>
                {playerBoard.map((row, rowIndex) =>
                  row.map((cell, colIndex) =>
                    renderCell(
                      playerBoard,
                      rowIndex,
                      colIndex,
                      false,
                      null
                    )
                  )
                )}
              </div>
            </div>
            {/* Player 2's Board (active) */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: '#0f0', fontFamily: 'monospace', marginBottom: 4 }}>
                Player 2's Waters
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`, gap: 2 }}>
                {enemyBoard.map((row, rowIndex) =>
                  row.map((cell, colIndex) =>
                    renderCell(
                      enemyBoard,
                      rowIndex,
                      colIndex,
                      true,
                      handleSetupClick
                    )
                  )
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Player Board */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: '#0f0', fontFamily: 'monospace', marginBottom: 4 }}>
                {mode === 1 && gamePhase === 'setup' && currentPlayer === 1 ? "Player 2: Place Your Ships" : "Your Board"}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`, gap: 2 }}>
                {playerBoard.map((row, rowIndex) =>
                  row.map((cell, colIndex) =>
                    renderCell(
                      playerBoard,
                      rowIndex,
                      colIndex,
                      (gamePhase === 'setup' && currentPlayer === 0) || (gamePhase === 'setup' && mode === 1 && currentPlayer === 1),
                      gamePhase === 'setup' && currentPlayer === 0 ? handleSetupClick : null
                    )
                  )
                )}
              </div>
            </div>
            {/* Enemy/Player 2 Board */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: '#0f0', fontFamily: 'monospace', marginBottom: 4 }}>
                {mode === 1 && gamePhase === 'setup' && currentPlayer === 0 ? "Player 1: Place Your Ships" : mode === 1 && gamePhase === 'setup' && currentPlayer === 1 ? "Player 2's Board" : "Enemy Board"}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`, gap: 2 }}>
                {enemyBoard.map((row, rowIndex) =>
                  row.map((cell, colIndex) =>
                    renderCell(
                      enemyBoard,
                      rowIndex,
                      colIndex,
                      (gamePhase === 'setup' && currentPlayer === 1),
                      gamePhase === 'setup' && currentPlayer === 1 ? handleSetupClick : (gamePhase === 'playing' && currentPlayer === 0 ? handleAttack : null)
                    )
                  )
                )}
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Game Status */}
      {gamePhase === 'gameOver' && (
        <div style={{ color: winner === 'Player' ? '#0f0' : '#f00', fontFamily: 'monospace', fontSize: '1.2rem', marginBottom: 8 }}>
          {winner === 'Player' ? '🎉 Victory!' : '💥 Defeat!'}
        </div>
      )}
      
      {/* Controls */}
      <div style={{ color: '#0f0', fontFamily: 'monospace', marginBottom: 8 }}>
        {gamePhase === 'setup' ? 
          'Click cells to place ships' : 
          'Click enemy board to attack'
        }
      </div>
      
      {/* New Game Button */}
      {(gamePhase === 'gameOver' || (gamePhase === 'setup' && currentPlayer === 0)) && (
        <button 
          onClick={() => {
            soundManager.buttonClick();
            initializeBoards();
          }} 
          style={{ 
            fontFamily: 'monospace', 
            fontSize: '1.2rem', 
            background: '#222', 
            color: '#0f0', 
            border: '2px solid #0f0', 
            padding: '8px 16px', 
            cursor: 'pointer',
            marginBottom: 8
          }}
        >
          New Game
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
          marginTop: 8,
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

export default Battleship; 