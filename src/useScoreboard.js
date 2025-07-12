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
    const data = scoreboardService.getLeaderboard(gameName);
    setLeaderboard(data);
  }, [gameName]);

  // Check if current score is a high score
  const checkHighScore = (score) => {
    return scoreboardService.isHighScore(gameName, score);
  };

  // Handle game over with score
  const handleGameOver = (score) => {
    setCurrentScore(score);
    
    if (checkHighScore(score)) {
      soundManager.sweep(400, 800, 0.3); // Victory sound
      setShowScoreEntry(true);
    } else {
      // Still show leaderboard even if not a high score
      setShowLeaderboard(true);
    }
  };

  // Handle score submission
  const handleScoreSubmit = (username) => {
    scoreboardService.addScore(gameName, username, currentScore);
    
    // Update local leaderboard
    const updatedLeaderboard = scoreboardService.getLeaderboard(gameName);
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
  const showLeaderboardManually = () => {
    soundManager.buttonClick();
    setShowLeaderboard(true);
  };

  // Get player's best score
  const getPlayerBestScore = (username) => {
    return scoreboardService.getPlayerBestScore(gameName, username);
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