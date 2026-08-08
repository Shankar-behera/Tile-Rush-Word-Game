const express = require('express');
const router = express.Router();
const { run, get, all } = require('../db/database');
const generateLetters = require('../utils/randomLetters');
const { scoreForWord } = require('../utils/scoring');
const { isValidWord } = require('../db/dictionary');

const GAME_DURATION_SECONDS = 120;

// Wrap async handlers so thrown errors reach Express's error handler
// instead of crashing the process or hanging the request.
const asyncHandler = (fn) => (req, res, next) => fn(req, res, next).catch(next);

function timeRemaining(game) {
  const elapsedMs = Date.now() - new Date(game.started_at).getTime();
  const remaining = game.duration_seconds - Math.floor(elapsedMs / 1000);
  return Math.max(0, remaining);
}

async function autoEndIfExpired(game) {
  if (game.status === 'active' && timeRemaining(game) <= 0) {
    const now = new Date().toISOString();
    await run(`UPDATE games SET status = 'ended', ended_at = ?, updated_at = ? WHERE id = ?`, [
      now,
      now,
      game.id,
    ]);
    game.status = 'ended';
    game.ended_at = now;
  }
  return game;
}

// Create new game
router.post(
  '/games',
  asyncHandler(async (req, res) => {
    const player_name = (req.body.player_name || '').trim();
    if (!player_name) {
      return res.status(400).json({ error: 'player_name is required' });
    }

    const letters = generateLetters();
    const now = new Date().toISOString();

    const { lastID } = await run(
      `INSERT INTO games (player_name, letters, status, score, duration_seconds, started_at, created_at, updated_at)
       VALUES (?, ?, 'active', 0, ?, ?, ?, ?)`,
      [player_name, letters, GAME_DURATION_SECONDS, now, now, now]
    );

    res.status(201).json({
      id: lastID,
      player_name,
      letters,
      score: 0,
      status: 'active',
      duration_seconds: GAME_DURATION_SECONDS,
      time_remaining: GAME_DURATION_SECONDS,
      started_at: now,
    });
  })
);

// Get game by ID
router.get(
  '/games/:id',
  asyncHandler(async (req, res) => {
    let game = await get('SELECT * FROM games WHERE id = ?', [req.params.id]);
    if (!game) return res.status(404).json({ error: 'Game not found' });

    game = await autoEndIfExpired(game);
    res.json({ ...game, time_remaining: timeRemaining(game) });
  })
);

// Get submitted words for a game
router.get(
  '/games/:id/words',
  asyncHandler(async (req, res) => {
    const words = await all(
      'SELECT id, word, score, created_at FROM words WHERE game_id = ? ORDER BY id DESC',
      [req.params.id]
    );
    res.json(words);
  })
);

// Submit word
router.post(
  '/games/:id/words',
  asyncHandler(async (req, res) => {
    const gameId = req.params.id;
    const rawWord = (req.body.word || '').trim();

    if (!rawWord) return res.status(400).json({ error: 'Word is required' });
    if (!/^[a-zA-Z]+$/.test(rawWord)) {
      return res.status(400).json({ error: 'Word must contain only letters' });
    }

    let game = await get('SELECT * FROM games WHERE id = ?', [gameId]);
    if (!game) return res.status(404).json({ error: 'Game not found' });

    game = await autoEndIfExpired(game);
    if (game.status !== 'active') {
      return res.status(400).json({ error: 'Game has already ended' });
    }

    const word = rawWord.toLowerCase();

    if (word.length < 2) {
      return res.status(400).json({ error: 'Word must be at least 2 letters' });
    }

    // Letters must be buildable from the board.
    const lettersAvailable = game.letters.toUpperCase().split('');
    for (const letter of word.toUpperCase().split('')) {
      const idx = lettersAvailable.indexOf(letter);
      if (idx === -1) {
        return res.status(400).json({ error: `"${rawWord}" uses letters not on your board` });
      }
      lettersAvailable.splice(idx, 1);
    }

    // No scoring the same word twice in one game.
    const alreadySubmitted = await get(
      'SELECT id FROM words WHERE game_id = ? AND word = ?',
      [gameId, word]
    );
    if (alreadySubmitted) {
      return res.status(400).json({ error: `You already scored "${rawWord}"` });
    }

    if (!isValidWord(word)) {
      return res.status(400).json({ error: `"${rawWord}" isn't in the dictionary` });
    }

    const score = scoreForWord(word);
    const now = new Date().toISOString();

    await run(
      'INSERT INTO words (game_id, word, score, created_at) VALUES (?, ?, ?, ?)',
      [gameId, word, score, now]
    );
    await run('UPDATE games SET score = score + ?, updated_at = ? WHERE id = ?', [
      score,
      now,
      gameId,
    ]);

    res.json({ word, score, total_score: game.score + score });
  })
);

// End game
router.patch(
  '/games/:id/end',
  asyncHandler(async (req, res) => {
    const game = await get('SELECT * FROM games WHERE id = ?', [req.params.id]);
    if (!game) return res.status(404).json({ error: 'Game not found' });

    const now = new Date().toISOString();
    await run(`UPDATE games SET status = 'ended', ended_at = ?, updated_at = ? WHERE id = ?`, [
      now,
      now,
      req.params.id,
    ]);

    res.json({ message: 'Game ended', id: Number(req.params.id) });
  })
);

// Leaderboard - top 10 finished games
router.get(
  '/leaderboard',
  asyncHandler(async (req, res) => {
    const rows = await all(
      `SELECT player_name, score, created_at FROM games
       WHERE status = 'ended'
       ORDER BY score DESC
       LIMIT 10`
    );
    res.json(rows);
  })
);

module.exports = router;
