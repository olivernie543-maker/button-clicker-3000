const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const Filter = require('bad-words');

const app = express();
const profanityFilter = new Filter();

app.use(cors());
app.use(express.json());

// ============================================================
// In-memory data store
// To swap in a real database, replace the `users` Map with DB
// calls in each helper function below.
// Structure: Map<userId, { username: string|null, clicks: number }>
// ============================================================
const users = new Map();

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
 * Increments click count for the user (creates a new user if needed).
 * Returns updated user info + leaderboard + whether username is needed.
 */
app.post('/api/click', (req, res) => {
  let { userId } = req.body;

  // Create a new user if userId is missing or unknown
  if (!userId || !users.has(userId)) {
    userId = uuidv4();
    users.set(userId, { username: null, clicks: 0 });
  }

  // Increment click count
  const user = users.get(userId);
  user.clicks += 1;

  const inTop100 = isInTop100(userId);
  const needsUsername = inTop100 && user.username === null;

  res.json({
    userId,
    clicks: user.clicks,
    username: user.username,
    inTop100,
    needsUsername,   // true = prompt the user to enter a username
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

  res.json({
    success: true,
    username: trimmed,
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
    clicks: user.clicks,
    username: user.username,
    inTop100: isInTop100(userId),
  });
});

// ============================================================
// Start server
// ============================================================
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Button Clicker 3000 backend running on http://localhost:${PORT}`);
});
