const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

// Try to import uuid with better error handling
let uuidv4;
try {
  const { v4 } = require('uuid');
  uuidv4 = v4;
} catch (error) {
  console.error('Error loading uuid module:', error.message);
  console.error('Please ensure uuid is installed: npm install uuid');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 4000;
const SCORES_FILE = path.join(__dirname, 'scores.json');
const ADMIN_CODE = 'TomTheCoder';

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

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
  try {
    fs.writeFileSync(SCORES_FILE, JSON.stringify(scores, null, 2));
  } catch (error) {
    console.error('Error writing scores to file:', error);
    throw new Error('Failed to save scores');
  }
}

// Helper: Validate admin code
function validateAdminCode(req) {
  const adminCode = req.headers['x-admin-code'];
  return adminCode === ADMIN_CODE;
}

// GET leaderboard for a game
app.get('/api/leaderboard/:game', (req, res) => {
  const { game } = req.params;
  const scores = readScores();
  const gameScores = scores[game] || [];
  // Ensure all entries have an id
  for (const entry of gameScores) {
    if (!entry.id) entry.id = uuidv4();
  }
  writeScores(scores);
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
  const newEntry = { id: uuidv4(), username, score, date: new Date().toISOString() };
  scores[game].push(newEntry);
  writeScores(scores);
  // Return the updated leaderboard array!
  let sorted;
  if (game === 'MemoryMatch') {
    sorted = [...scores[game]].sort((a, b) => a.score - b.score);
  } else {
    sorted = [...scores[game]].sort((a, b) => b.score - a.score);
  }
  res.json(sorted.slice(0, 10));
});

// PUT update score (admin only)
app.put('/api/leaderboard/:game/:scoreId', (req, res) => {
  if (!validateAdminCode(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { game, scoreId } = req.params;
  const { username, score } = req.body;
  
  if (!username || typeof score !== 'number') {
    return res.status(400).json({ error: 'Invalid username or score' });
  }
  
  const scores = readScores();
  if (!scores[game]) {
    return res.status(404).json({ error: 'Score not found' });
  }
  const idx = scores[game].findIndex(entry => entry.id === scoreId);
  if (idx === -1) {
    return res.status(404).json({ error: 'Score not found' });
  }
  // Update the score
  scores[game][idx] = { ...scores[game][idx], username, score, date: new Date().toISOString() };
  writeScores(scores);
  // Return updated leaderboard
  let sorted;
  if (game === 'MemoryMatch') {
    sorted = [...scores[game]].sort((a, b) => a.score - b.score);
  } else {
    sorted = [...scores[game]].sort((a, b) => b.score - a.score);
  }
  res.json(sorted.slice(0, 10));
});

// DELETE score (admin only)
app.delete('/api/leaderboard/:game/:scoreId', (req, res) => {
  if (!validateAdminCode(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const { game, scoreId } = req.params;
  const scores = readScores();
  if (!scores[game]) {
    return res.status(404).json({ error: 'Score not found' });
  }
  const idx = scores[game].findIndex(entry => entry.id === scoreId);
  if (idx === -1) {
    return res.status(404).json({ error: 'Score not found' });
  }
  // Remove the score
  scores[game].splice(idx, 1);
  writeScores(scores);
  // Return updated leaderboard
  let sorted;
  if (game === 'MemoryMatch') {
    sorted = [...scores[game]].sort((a, b) => a.score - b.score);
  } else {
    sorted = [...scores[game]].sort((a, b) => b.score - a.score);
  }
  res.json(sorted.slice(0, 10));
});

// GET all games with their top scores
app.get('/api/leaderboard', (req, res) => {
  const scores = readScores();
  // Ensure all entries have an id
  for (const arr of Object.values(scores)) {
    for (const entry of arr) {
      if (!entry.id) entry.id = uuidv4();
    }
  }
  writeScores(scores);
  // Convert to array of { game, scores: [...] }
  const gamesWithScores = Object.entries(scores)
    .filter(([game, arr]) => Array.isArray(arr) && arr.length > 0)
    .map(([game, arr]) => ({
      game,
      scores: arr
    }));
  res.json(gamesWithScores);
});

app.listen(PORT, () => {
  console.log(`Leaderboard backend running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Scores file: ${SCORES_FILE}`);
}); 