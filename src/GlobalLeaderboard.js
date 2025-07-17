import React, { useState, useEffect } from 'react';
import soundManager from './sounds';
import scoreboardService from './scoreboardService';

const GlobalLeaderboard = ({ onClose }) => {
  const [gamesWithScores, setGamesWithScores] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Load all games with leaderboards
    const loadGames = async () => {
      try {
        const games = await scoreboardService.getGamesWithLeaderboards();
        setGamesWithScores(games);
      } catch (error) {
        console.error('Error loading games:', error);
        setGamesWithScores([]);
      }
      setIsVisible(true);
    };
    loadGames();
  }, []);

  const handleClose = () => {
    soundManager.buttonClick();
    setIsVisible(false);
    setTimeout(() => onClose(), 200);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const selectGame = (gameName) => {
    soundManager.buttonClick();
    setSelectedGame(gameName);
  };

  const goBack = () => {
    soundManager.buttonClick();
    setSelectedGame(null);
  };

  if (selectedGame) {
    const leaderboard = scoreboardService.getLeaderboard(selectedGame);
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.2s ease-in-out'
      }}>
        <div style={{
          background: '#111',
          border: '3px solid #0f0',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 0 20px #0f0'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h2 style={{
              fontFamily: 'monospace',
              color: '#0f0',
              margin: 0,
              textShadow: '2px 2px #000'
            }}>
              🏆 {selectedGame} Leaderboard 🏆
            </h2>
            <button
              onClick={handleClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#0f0',
                fontSize: '1.5rem',
                cursor: 'pointer',
                fontFamily: 'monospace',
                padding: '4px 8px'
              }}
            >
              ✕
            </button>
          </div>

          {leaderboard.length === 0 ? (
            <div style={{
              color: '#888',
              fontFamily: 'monospace',
              textAlign: 'center',
              padding: '40px 20px',
              fontSize: '1.1rem'
            }}>
              No scores yet! Be the first to set a record!
            </div>
          ) : (
            <div>
              {/* Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '60px 1fr 120px 150px',
                gap: '12px',
                padding: '12px',
                borderBottom: '2px solid #0f0',
                fontFamily: 'monospace',
                color: '#0f0',
                fontWeight: 'bold',
                fontSize: '1rem'
              }}>
                <div>Rank</div>
                <div>Player</div>
                <div>Score</div>
                <div>Date</div>
              </div>

              {/* Scores */}
              {leaderboard.map((entry, index) => (
                <div
                  key={entry.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '60px 1fr 120px 150px',
                    gap: '12px',
                    padding: '12px',
                    borderBottom: '1px solid #333',
                    fontFamily: 'monospace',
                    color: '#0f0',
                    fontSize: '0.9rem',
                    backgroundColor: index < 3 ? 'rgba(0, 255, 0, 0.1)' : 'transparent'
                  }}
                >
                  <div style={{
                    fontWeight: 'bold',
                    color: index === 0 ? '#ffd700' : 
                           index === 1 ? '#c0c0c0' : 
                           index === 2 ? '#cd7f32' : '#0f0'
                  }}>
                    #{index + 1}
                  </div>
                  <div style={{
                    fontWeight: 'bold',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {entry.username}
                  </div>
                  <div style={{ fontWeight: 'bold' }}>
                    {entry.score.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#888' }}>
                    {scoreboardService.formatDate(entry.date)}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{
            marginTop: '20px',
            textAlign: 'center'
          }}>
            <button
              onClick={goBack}
              style={{
                fontFamily: 'monospace',
                fontSize: '1rem',
                background: '#222',
                color: '#0f0',
                border: '2px solid #0f0',
                padding: '10px 20px',
                cursor: 'pointer',
                borderRadius: '4px',
                marginRight: '8px'
              }}
            >
              Back to Games
            </button>
            <button
              onClick={handleClose}
              style={{
                fontFamily: 'monospace',
                fontSize: '1rem',
                background: '#222',
                color: '#0f0',
                border: '2px solid #0f0',
                padding: '10px 20px',
                cursor: 'pointer',
                borderRadius: '4px'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      opacity: isVisible ? 1 : 0,
      transition: 'opacity 0.2s ease-in-out'
    }}>
      <div style={{
        background: '#111',
        border: '3px solid #0f0',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 0 20px #0f0'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{
            fontFamily: 'monospace',
            color: '#0f0',
            margin: 0,
            textShadow: '2px 2px #000'
          }}>
            🏆 Global Leaderboards 🏆
          </h2>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#0f0',
              fontSize: '1.5rem',
              cursor: 'pointer',
              fontFamily: 'monospace',
              padding: '4px 8px'
            }}
          >
            ✕
          </button>
        </div>

        {gamesWithScores.length === 0 ? (
          <div style={{
            color: '#888',
            fontFamily: 'monospace',
            textAlign: 'center',
            padding: '40px 20px',
            fontSize: '1.1rem'
          }}>
            No leaderboards yet! Play some games to see scores here!
          </div>
        ) : (
          <div>
            <div style={{
              color: '#0f0',
              fontFamily: 'monospace',
              marginBottom: '16px',
              fontSize: '1rem'
            }}>
              Select a game to view its leaderboard:
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px'
            }}>
              {gamesWithScores.map((gameName) => {
                const leaderboard = scoreboardService.getLeaderboard(gameName);
                const topScore = leaderboard.length > 0 ? leaderboard[0].score : 0;
                
                return (
                  <button
                    key={gameName}
                    onClick={() => selectGame(gameName)}
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '1rem',
                      background: '#222',
                      color: '#0f0',
                      border: '2px solid #0f0',
                      padding: '16px',
                      cursor: 'pointer',
                      borderRadius: '8px',
                      textAlign: 'left',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = '#333';
                      e.target.style.boxShadow = '0 0 10px #0f0';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = '#222';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {gameName}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#888' }}>
                      Top Score: {topScore.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
                      {leaderboard.length} entries
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div style={{
          marginTop: '20px',
          textAlign: 'center'
        }}>
          <button
            onClick={handleClose}
            style={{
              fontFamily: 'monospace',
              fontSize: '1rem',
              background: '#222',
              color: '#0f0',
              border: '2px solid #0f0',
              padding: '10px 20px',
              cursor: 'pointer',
              borderRadius: '4px'
            }}
          >
            Close
          </button>
        </div>

        <div style={{
          color: '#888',
          fontFamily: 'monospace',
          fontSize: '0.8rem',
          textAlign: 'center',
          marginTop: '16px'
        }}>
          Press ESC to close
        </div>
      </div>
    </div>
  );
};

export default GlobalLeaderboard; 