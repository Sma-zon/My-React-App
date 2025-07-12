// Scoreboard service for managing game scores and leaderboards
class ScoreboardService {
  constructor() {
    this.storageKey = 'retroGamesLeaderboards';
    this.leaderboards = this.loadLeaderboards();
  }

  // Load leaderboards from localStorage
  loadLeaderboards() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error loading leaderboards:', error);
      return {};
    }
  }

  // Save leaderboards to localStorage
  saveLeaderboards() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.leaderboards));
    } catch (error) {
      console.error('Error saving leaderboards:', error);
    }
  }

  // Get leaderboard for a specific game
  getLeaderboard(gameName) {
    return this.leaderboards[gameName] || [];
  }

  // Add a new score to a game's leaderboard
  addScore(gameName, username, score, date = new Date().toISOString()) {
    if (!this.leaderboards[gameName]) {
      this.leaderboards[gameName] = [];
    }

    const newScore = {
      username,
      score,
      date,
      id: Date.now() + Math.random() // Unique ID for each score
    };

    this.leaderboards[gameName].push(newScore);
    
    // Sort by score (highest first) and keep only top 10
    this.leaderboards[gameName].sort((a, b) => b.score - a.score);
    this.leaderboards[gameName] = this.leaderboards[gameName].slice(0, 10);
    
    this.saveLeaderboards();
    return newScore;
  }

  // Check if a score qualifies for the leaderboard
  isHighScore(gameName, score) {
    const leaderboard = this.getLeaderboard(gameName);
    if (leaderboard.length < 10) return true;
    return score > leaderboard[leaderboard.length - 1].score;
  }

  // Get player's best score for a game
  getPlayerBestScore(gameName, username) {
    const leaderboard = this.getLeaderboard(gameName);
    const playerScores = leaderboard.filter(entry => entry.username === username);
    return playerScores.length > 0 ? Math.max(...playerScores.map(s => s.score)) : 0;
  }

  // Format date for display
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Clear all leaderboards (for testing/reset)
  clearAllLeaderboards() {
    this.leaderboards = {};
    this.saveLeaderboards();
  }

  // Get all games that have leaderboards
  getGamesWithLeaderboards() {
    return Object.keys(this.leaderboards).filter(game => this.leaderboards[game].length > 0);
  }
}

// Create and export a singleton instance
const scoreboardService = new ScoreboardService();
export default scoreboardService; 