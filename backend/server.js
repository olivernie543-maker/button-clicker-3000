const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const Filter = require('bad-words');
const fs = require('fs');
const path = require('path');

const app = express();
const profanityFilter = new Filter();

app.use(cors());
app.use(express.json());

// ============================================================
// File-based persistence
// data.json sits next to server.js and survives server restarts.
// To swap to a real database, replace loadData/saveData with DB calls.
// ============================================================
const DATA_FILE = path.join(__dirname, 'data.json');

function loadData() {
  if (!fs.existsSync(DATA_FILE)) return;
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    for (const [userId, userData] of Object.entries(parsed)) {
      users.set(userId, {
        username:   userData.username   ?? null,
        clicks:     userData.clicks     ?? 0,
        clickBonus: userData.clickBonus ?? 1, // default: 1 click per press
      });
    }
    console.log(`Loaded ${users.size} users from ${DATA_FILE}`);
  } catch (e) {
    console.error('Failed to load data.json:', e);
  }
}

function saveData() {
  try {
    const obj = {};
    for (const [userId, userData] of users.entries()) {
      obj[userId] = userData;
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(obj, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save data.json:', e);
  }
}

// ============================================================
// In-memory data store (backed by data.json for persistence)
// Structure: Map<userId, { username, clicks, clickBonus }>
// ============================================================
const users = new Map();
loadData(); // restore from disk on startup

// ============================================================
// Helper functions
// ============================================================

/**
 * Returns the sorted Top 100 leaderboard.
 * Only includes users who have set a username.
 */
function getLeaderboard() {
  return Array.from(users.entries())
    .filter(([, data]) => data.username !== null)
    .map(([userId, data]) => ({
      userId,
      username: data.username,
      clicks: data.clicks,
    }))
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 100)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

/**
 * Checks if a given userId is within the overall Top 100 by click count
 * (regardless of whether they have a username yet).
 */
function isInTop100(userId) {
  const sorted = Array.from(users.entries())
    .sort(([, a], [, b]) => b.clicks - a.clicks);

  const rank = sorted.findIndex(([id]) => id === userId);
  return rank !== -1 && rank < 100;
}

/**
 * Validates a username string.
 * Returns null if valid, or an error string if invalid.
 */
function validateUsername(username) {
  if (!username || typeof username !== 'string') {
    return 'Username is required';
  }
  const trimmed = username.trim();
  if (trimmed.length === 0) {
    return 'Username cannot be empty';
  }
  if (trimmed.length > 20) {
    return 'Username must be 20 characters or fewer';
  }
  if (!/^[a-zA-Z0-9 _\-]+$/.test(trimmed)) {
    return 'Username may only contain letters, numbers, spaces, underscores, and hyphens';
  }
  if (profanityFilter.isProfane(trimmed)) {
    return 'Please choose a family-friendly username';
  }
  return null; // valid
}

// ============================================================
// API Routes
// ============================================================

/**
 * POST /api/click
 * Body: { userId?: string }
 * Increments click count by user.clickBonus (1 by default, 2 after upgrade).
 * Returns updated user info + leaderboard + whether username is needed.
 */
app.post('/api/click', (req, res) => {
  let { userId } = req.body;

  // Create a new user if userId is missing or unknown
  if (!userId || !users.has(userId)) {
    userId = uuidv4();
    users.set(userId, { username: null, clicks: 0, clickBonus: 1 });
  }

  // Increment by clickBonus (1 normally, 2 after "+1 Click" upgrade)
  const user = users.get(userId);
  user.clicks += user.clickBonus;

  saveData(); // persist after every click

  const inTop100 = isInTop100(userId);
  const needsUsername = inTop100 && user.username === null;

  res.json({
    userId,
    clicks:     user.clicks,
    username:   user.username,
    clickBonus: user.clickBonus,
    inTop100,
    needsUsername,
    leaderboard: getLeaderboard(),
  });
});

/**
 * GET /api/leaderboard
 * Returns the current Top 100 leaderboard.
 */
app.get('/api/leaderboard', (req, res) => {
  res.json({ leaderboard: getLeaderboard() });
});

/**
 * POST /api/username
 * Body: { userId: string, username: string }
 * Sets the display name for a user after they enter the Top 100.
 */
app.post('/api/username', (req, res) => {
  const { userId, username } = req.body;

  if (!userId || !users.has(userId)) {
    return res.status(400).json({ error: 'Invalid or unknown user ID' });
  }

  const validationError = validateUsername(username);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const trimmed = username.trim();

  // Reject duplicate usernames (case-insensitive)
  const duplicate = Array.from(users.entries()).find(
    ([id, data]) => id !== userId && data.username?.toLowerCase() === trimmed.toLowerCase()
  );
  if (duplicate) {
    return res.status(400).json({ error: 'That username is already taken' });
  }

  users.get(userId).username = trimmed;
  saveData();

  res.json({
    success: true,
    username: trimmed,
    leaderboard: getLeaderboard(),
  });
});

/**
 * POST /api/upgrade
 * Body: { userId: string }
 * Purchases the "+1 Click" upgrade for 500 clicks.
 * Sets clickBonus to 2 so every future click counts twice.
 */
app.post('/api/upgrade', (req, res) => {
  const { userId } = req.body;
  const UPGRADE_COST = 500;

  if (!userId || !users.has(userId)) {
    return res.status(400).json({ error: 'Invalid or unknown user ID' });
  }

  const user = users.get(userId);

  if (user.clickBonus >= 2) {
    return res.status(400).json({ error: 'Upgrade already purchased' });
  }

  if (user.clicks < UPGRADE_COST) {
    return res.status(400).json({ error: 'Not enough clicks (need 500)' });
  }

  user.clicks     -= UPGRADE_COST; // deduct cost
  user.clickBonus  = 2;            // each press now gives 2 clicks
  saveData();

  res.json({
    userId,
    clicks:     user.clicks,
    clickBonus: user.clickBonus,
    leaderboard: getLeaderboard(),
  });
});

/**
 * GET /api/user/:userId
 * Returns the current state for a specific user (used on page load to restore state).
 */
app.get('/api/user/:userId', (req, res) => {
  const { userId } = req.params;

  if (!users.has(userId)) {
    return res.status(404).json({ error: 'User not found' });
  }

  const user = users.get(userId);
  res.json({
    userId,
    clicks:     user.clicks,
    username:   user.username,
    clickBonus: user.clickBonus ?? 1,
    inTop100:   isInTop100(userId),
  });
});

// ============================================================
// Start server
// ============================================================
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Button Clicker 3000 backend running on http://localhost:${PORT}`);
});
