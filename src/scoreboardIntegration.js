// Helper functions for integrating scoreboard into games
// This file contains the common patterns for adding scoreboard functionality

export const addScoreboardImports = (fileContent) => {
  // Add imports after existing imports
  const importPattern = /import.*from.*['"]react['"];?\s*\n/;
  const newImports = `import useScoreboard from './useScoreboard';
import ScoreEntry from './ScoreEntry';
import Leaderboard from './Leaderboard';
`;
  
  return fileContent.replace(importPattern, `$&${newImports}`);
};

export const addScoreboardHook = (fileContent, gameName) => {
  // Find the function declaration and add scoreboard hook after state declarations
  const functionPattern = /function\s+\w+\(\)\s*\{[\s\S]*?const\s+\[.*?\]\s*=\s*useState\([^)]*\);/g;
  
  const scoreboardHook = `
  // Scoreboard functionality
  const {
    showScoreEntry,
    showLeaderboard,
    handleGameOver,
    handleScoreSubmit,
    handleScoreCancel,
    handleLeaderboardClose,
    showLeaderboardManually,
    getTopScore
  } = useScoreboard('${gameName}');`;
  
  return fileContent.replace(functionPattern, (match) => {
    return match + scoreboardHook;
  });
};

export const addGameOverHandler = (fileContent, gameOverPattern) => {
  // Add handleGameOver call to existing game over logic
  const newGameOverPattern = gameOverPattern.replace(
    /setGameOver\(true\);/,
    'setGameOver(true);\n          handleGameOver(score);'
  );
  
  return fileContent.replace(gameOverPattern, newGameOverPattern);
};

export const addLeaderboardButton = (fileContent) => {
  // Find the restart button and add leaderboard button next to it
  const restartButtonPattern = /\(\s*<button[^>]*onClick[^>]*>\s*\{[^}]*\?\s*['"][^'"]*['"]\s*:\s*['"][^'"]*['"]\}\s*<\/button>\s*\)/;
  
  const leaderboardButton = `
        <button
          onClick={showLeaderboardManually}
          style={{
            fontFamily: 'monospace',
            fontSize: '1rem',
            background: '#222',
            color: '#0f0',
            border: '2px solid #0f0',
            padding: '8px 16px',
            cursor: 'pointer'
          }}
        >
          Leaderboard
        </button>`;
  
  return fileContent.replace(restartButtonPattern, (match) => {
    return `      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        ${match}
        ${leaderboardButton}
      </div>`;
  });
};

export const addScoreboardModals = (fileContent, gameName) => {
  // Add scoreboard modals before the closing div
  const closingDivPattern = /(\s*<\/div>\s*\);\s*\n\s*\}\s*\n\s*export default)/;
  
  const modals = `
      {/* Score Entry Modal */}
      {showScoreEntry && (
        <ScoreEntry
          score={score}
          gameName="${gameName}"
          onSubmit={handleScoreSubmit}
          onCancel={handleScoreCancel}
        />
      )}
      
      {/* Leaderboard Modal */}
      {showLeaderboard && (
        <Leaderboard
          gameName="${gameName}"
          onClose={handleLeaderboardClose}
        />
      )}`;
  
  return fileContent.replace(closingDivPattern, `${modals}$1`);
};

export const updateHighScoreDisplay = (fileContent) => {
  // Update high score display to use getTopScore()
  const highScorePattern = /High Score:\s*\{[^}]+\}/g;
  
  return fileContent.replace(highScorePattern, 'High Score: {getTopScore()}');
};

// List of games that should have scoreboards (excluding the ones you mentioned)
export const GAMES_WITH_SCOREBOARDS = [
  'Snake',
  'Tetris', 
  'Flappy Bird',
  'Pong',
  'Breakout',
  'Frogger',
  'Game2048',
  'Sidescroller',
  'Minesweeper',
  'Battleship',
  'Sudoku',
  'MemoryMatch',
  'WordSearch',
  'ConnectFour',
  'PacMan',
  'Platformer'
];

// Games that should NOT have scoreboards
export const GAMES_WITHOUT_SCOREBOARDS = [
  'TicTacToe',
  'RockPaperScissors', 
  'SimonSays'
]; 