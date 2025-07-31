import config from './config';

// Scoreboard service for managing game scores and leaderboards via backend API
class ScoreboardService {
  constructor() {
    this.apiBase = `${config.backendUrl}/api/leaderboard`;
    this.leaderboards = {};
    this.adminCode = 'TomTheCoder';
  }

  // Validate admin code
  validateAdminCode(code) {
    return code === this.adminCode;
  }

  // Update a score entry (admin only)
  async updateScore(gameName, scoreId, newUsername, newScore) {
    try {
      const res = await fetch(`${this.apiBase}/${encodeURIComponent(gameName)}/${scoreId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-code': this.adminCode
        },
        body: JSON.stringify({ username: newUsername, score: newScore })
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to update score: ${res.status} - ${errorText}`);
      }
      
      // Refetch leaderboard after updating
      return await this.getLeaderboard(gameName);
    } catch (error) {
      console.error('Error updating score:', error);
      throw error;
    }
  }

  // Delete a score entry (admin only)
  async deleteScore(gameName, scoreId) {
    try {
      const res = await fetch(`${this.apiBase}/${encodeURIComponent(gameName)}/${scoreId}`, {
        method: 'DELETE',
        headers: {
          'x-admin-code': this.adminCode
        }
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to delete score: ${res.status} - ${errorText}`);
      }
      
      // Refetch leaderboard after deleting
      return await this.getLeaderboard(gameName);
    } catch (error) {
      console.error('Error deleting score:', error);
      throw error;
    }
  }

  // Get leaderboard for a specific game (fetch from backend)
  async getLeaderboard(gameName) {
    try {
      const res = await fetch(`${this.apiBase}/${encodeURIComponent(gameName)}`);
      if (!res.ok) throw new Error('Failed to fetch leaderboard');
      const data = await res.json();
      this.leaderboards[gameName] = data;
      return data;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return this.leaderboards[gameName] || [];
    }
  }

  // Add a new score to a game's leaderboard (POST to backend)
  async addScore(gameName, username, score, date = new Date().toISOString()) {
    try {
      console.log(`Attempting to submit score: ${score} for ${gameName} by ${username}`);
      const res = await fetch(`${this.apiBase}/${encodeURIComponent(gameName)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, score, date })
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Backend error: ${res.status} - ${errorText}`);
        throw new Error(`Failed to submit score: ${res.status} - ${errorText}`);
      }
      
      console.log('Score submitted successfully');
      // Refetch leaderboard after adding
      return await this.getLeaderboard(gameName);
    } catch (error) {
      console.error('Error submitting score:', error);
      throw error; // Re-throw so the UI can handle it
    }
  }

  // Check if a score qualifies for the leaderboard (client-side, after fetch)
  async isHighScore(gameName, score) {
    const leaderboard = await this.getLeaderboard(gameName);
    if (gameName === 'MemoryMatch') {
      // Lower time is better
      if (leaderboard.length === 0) return score > 0;
      if (leaderboard.length < 10) return true;
      const worst = leaderboard[leaderboard.length - 1].score;
      return score < worst;
    } else {
      // Higher score is better
      if (leaderboard.length === 0) return score > 0;
      if (leaderboard.length < 10) return score > 0; // Only consider scores > 0 for empty leaderboards
      const lowestScore = leaderboard[leaderboard.length - 1].score;
      return score > lowestScore;
    }
  }

  // Get player's best score for a game
  async getPlayerBestScore(gameName, username) {
    const leaderboard = await this.getLeaderboard(gameName);
    const playerScores = leaderboard.filter(entry => entry.username === username);
    if (gameName === 'MemoryMatch') {
      return playerScores.length > 0 ? Math.min(...playerScores.map(s => s.score)) : 0;
    } else {
      return playerScores.length > 0 ? Math.max(...playerScores.map(s => s.score)) : 0;
    }
  }

  // Format date for display
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Get all games that have leaderboards (fetch from backend)
  async getGamesWithLeaderboards() {
    try {
      const res = await fetch(this.apiBase);
      if (!res.ok) throw new Error('Failed to fetch games with leaderboards');
      const data = await res.json();
      // Return the full array of { game, scores }
      return data;
    } catch (error) {
      console.error('Error fetching games with leaderboards:', error);
      return [];
    }
  }
}

// Create and export a singleton instance
const scoreboardService = new ScoreboardService();
export default scoreboardService; 