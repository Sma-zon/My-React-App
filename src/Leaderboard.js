import React, { useState, useEffect } from 'react';
import soundManager from './sounds';
import scoreboardService from './scoreboardService';

const Leaderboard = ({ gameName, onClose }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [editUsername, setEditUsername] = useState('');
  const [editScore, setEditScore] = useState('');
  const [adminError, setAdminError] = useState('');

  useEffect(() => {
    // Load leaderboard data
    const loadLeaderboard = async () => {
      try {
        const data = await scoreboardService.getLeaderboard(gameName);
        setLeaderboard(data || []);
      } catch (error) {
        console.error('Error loading leaderboard:', error);
        setLeaderboard([]);
      }
      setIsVisible(true);
    };
    
    loadLeaderboard();
  }, [gameName]);

  const handleClose = () => {
    soundManager.buttonClick();
    setIsVisible(false);
    setTimeout(() => onClose(), 200); // Allow time for fade animation
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

  const handleAdminCodeSubmit = (e) => {
    e.preventDefault();
    if (scoreboardService.validateAdminCode(adminCode)) {
      setAdminUnlocked(true);
      setAdminError('');
    } else {
      setAdminUnlocked(false);
      setAdminError('Incorrect code.');
    }
  };

  const startEdit = (index, entry) => {
    setEditIndex(index);
    setEditUsername(entry.username);
    setEditScore(entry.score);
  };

  const cancelEdit = () => {
    setEditIndex(null);
    setEditUsername('');
    setEditScore('');
  };

  const saveEdit = async (index, entry) => {
    try {
      const updated = await scoreboardService.updateScore(gameName, entry.id, editUsername, Number(editScore));
      setLeaderboard(updated);
      cancelEdit();
    } catch (err) {
      setAdminError('Failed to update score.');
    }
  };

  const deleteEntry = async (index, entry) => {
    if (!window.confirm('Are you sure you want to delete this score?')) return;
    try {
      const updated = await scoreboardService.deleteScore(gameName, entry.id);
      setLeaderboard(updated);
    } catch (err) {
      setAdminError('Failed to delete score.');
    }
  };

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
        boxShadow: '0 0 20px #0f0',
        position: 'relative'
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
            🏆 {gameName} Leaderboard 🏆
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
              gridTemplateColumns: adminUnlocked ? '60px 1fr 120px 150px 120px' : '60px 1fr 120px 150px',
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
              {adminUnlocked && <div>Admin</div>}
            </div>

            {/* Scores */}
            {leaderboard.map((entry, index) => (
              <div
                key={entry.id || index}
                style={{
                  display: 'grid',
                  gridTemplateColumns: adminUnlocked ? '60px 1fr 120px 150px 120px' : '60px 1fr 120px 150px',
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
                {editIndex === index ? (
                  <input
                    value={editUsername}
                    onChange={e => setEditUsername(e.target.value)}
                    style={{ fontFamily: 'monospace', width: '90%' }}
                  />
                ) : (
                  <div style={{
                    fontWeight: 'bold',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {entry.username}
                  </div>
                )}
                {editIndex === index ? (
                  <input
                    type="number"
                    value={editScore}
                    onChange={e => setEditScore(e.target.value)}
                    style={{ fontFamily: 'monospace', width: '90%' }}
                  />
                ) : (
                  <div style={{ fontWeight: 'bold' }}>
                    {entry.score.toLocaleString()}
                  </div>
                )}
                <div style={{ fontSize: '0.8rem', color: '#888' }}>
                  {scoreboardService.formatDate(entry.date)}
                </div>
                {adminUnlocked && (
                  <div style={{ display: 'flex', gap: 4 }}>
                    {editIndex === index ? (
                      <>
                        <button onClick={() => saveEdit(index, entry)} style={{ fontFamily: 'monospace', color: '#0f0', background: '#222', border: '1px solid #0f0', borderRadius: 3, marginRight: 4 }}>Save</button>
                        <button onClick={cancelEdit} style={{ fontFamily: 'monospace', color: '#f00', background: '#222', border: '1px solid #f00', borderRadius: 3 }}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(index, entry)} style={{ fontFamily: 'monospace', color: '#0f0', background: '#222', border: '1px solid #0f0', borderRadius: 3, marginRight: 4 }}>Edit</button>
                        <button onClick={() => deleteEntry(index, entry)} style={{ fontFamily: 'monospace', color: '#f00', background: '#222', border: '1px solid #f00', borderRadius: 3 }}>Delete</button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
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

        {/* Admin section */}
        <div style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          padding: '12px',
          background: 'rgba(0,0,0,0.7)',
          borderTopRightRadius: 8,
          border: '1px solid #0f0',
          minWidth: 180
        }}>
          {adminUnlocked ? (
            <div style={{ color: '#0f0', fontFamily: 'monospace', fontSize: '0.95rem' }}>
              Admin mode enabled
            </div>
          ) : (
            <form onSubmit={handleAdminCodeSubmit}>
              <input
                type="password"
                value={adminCode}
                onChange={e => setAdminCode(e.target.value)}
                placeholder="Enter admin code"
                style={{ 
                  fontFamily: 'monospace', 
                  width: '100%', 
                  marginBottom: 4,
                  background: '#222',
                  color: '#666',
                  border: '1px solid #333',
                  borderRadius: 3,
                  padding: '4px 8px',
                  fontSize: '0.8rem'
                }}
              />
              <button type="submit" style={{ 
                fontFamily: 'monospace', 
                width: '100%', 
                background: '#222', 
                color: '#666', 
                border: '1px solid #333', 
                borderRadius: 3,
                padding: '4px 8px',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}>Unlock</button>
              {adminError && <div style={{ color: '#f00', fontSize: '0.85rem', marginTop: 2 }}>{adminError}</div>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard; 