import { useState, useEffect } from 'react';
import scoreboardService from './scoreboardService';
import soundManager from './sounds';

const useScoreboard = (gameName) => {
  const [showScoreEntry, setShowScoreEntry] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [currentScore, setCurrentScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);

  // Load leaderboard data
  useEffect(() => {
    (async () => {
      const data = await scoreboardService.getLeaderboard(gameName);
      setLeaderboard(data);
    })();
  }, [gameName]);

  // Check if current score is a high score
  const checkHighScore = async (score) => {
    return await scoreboardService.isHighScore(gameName, score);
  };

  // Handle game over with score
  const handleGameOver = async (score) => {
    setCurrentScore(score);
    try {
      const isHigh = await checkHighScore(score);
      if (isHigh) {
        soundManager.sweep(400, 0.3); // Victory sound
        setShowScoreEntry(true);
      } else {
        // Only show leaderboard if there's data or if score > 0
        if (score > 0 || leaderboard.length > 0) {
          setShowLeaderboard(true);
        }
      }
    } catch (error) {
      console.error('Error checking high score:', error);
      // If theres an error, don't show any modal to prevent blank page
    }
  };

  // Handle score submission
  const handleScoreSubmit = async (username) => {
    await scoreboardService.addScore(gameName, username, currentScore);
    const updatedLeaderboard = await scoreboardService.getLeaderboard(gameName);
    setLeaderboard(updatedLeaderboard);
    setShowScoreEntry(false);
    setShowLeaderboard(true);
  };

  // Handle score entry cancellation
  const handleScoreCancel = () => {
    setShowScoreEntry(false);
    setShowLeaderboard(true);
  };

  // Handle leaderboard close
  const handleLeaderboardClose = () => {
    setShowLeaderboard(false);
  };

  // Show leaderboard manually
  const showLeaderboardManually = async () => {
    soundManager.buttonClick();
    const updatedLeaderboard = await scoreboardService.getLeaderboard(gameName);
    setLeaderboard(updatedLeaderboard);
    setShowLeaderboard(true);
  };

  // Get player's best score
  const getPlayerBestScore = async (username) => {
    return await scoreboardService.getPlayerBestScore(gameName, username);
  };

  // Get top score
  const getTopScore = () => {
    return leaderboard.length > 0 ? leaderboard[0].score : 0;
  };

  return {
    // State
    showScoreEntry,
    showLeaderboard,
    currentScore,
    leaderboard,
    
    // Functions
    handleGameOver,
    handleScoreSubmit,
    handleScoreCancel,
    handleLeaderboardClose,
    showLeaderboardManually,
    checkHighScore,
    getPlayerBestScore,
    getTopScore
  };
};

export default useScoreboard; 