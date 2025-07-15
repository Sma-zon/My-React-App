const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;
const SCORES_FILE = path.join(__dirname, 'scores.json');

app.use(cors());
app.use(express.json());

// Helper: Read scores from file
function readScores() {
  if (!fs.existsSync(SCORES_FILE)) return {};
  const data = fs.readFileSync(SCORES_FILE, 'utf-8');
  try {
    return JSON.parse(data);
  } catch {
    return {};
  }
}

// Helper: Write scores to file
function writeScores(scores) {
  fs.writeFileSync(SCORES_FILE, JSON.stringify(scores, null, 2));
}

// GET leaderboard for a game
app.get('/api/leaderboard/:game', (req, res) => {
  const { game } = req.params;
  const scores = readScores();
  const gameScores = scores[game] || [];
  // Sort descending by score (or ascending by time for MemoryMatch)
  let sorted;
  if (game === 'MemoryMatch') {
    sorted = [...gameScores].sort((a, b) => a.score - b.score); // lower time is better
  } else {
    sorted = [...gameScores].sort((a, b) => b.score - a.score); // higher score is better
  }
  res.json(sorted.slice(0, 10));
});

// POST new score for a game
app.post('/api/leaderboard/:game', (req, res) => {
  const { game } = req.params;
  const { username, score } = req.body;
  if (!username || typeof score !== 'number') {
    return res.status(400).json({ error: 'Invalid username or score' });
  }
  const scores = readScores();
  if (!scores[game]) scores[game] = [];
  scores[game].push({ username, score, date: new Date().toISOString() });
  writeScores(scores);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Leaderboard backend running on port ${PORT}`);
}); 