# Tile Rush — Word Game

A word-building game: 10 letter tiles, 2 minutes, find as many valid words
as you can. React frontend + Express/SQLite backend.

![Tile-Rush word-Game](output/output.png)

```
wordgame/
├── backend/     Express API (games, scoring, dictionary, leaderboard)
└── frontend/    React app (the redesigned "Tile Rush" UI)
```

## Architecture

### System overview

```
┌─────────────────────┐         HTTP / JSON        ┌──────────────────────────┐
│   React Frontend     │  ───────────────────────▶  │   Express Backend        │
│   (localhost:3000)   │  ◀───────────────────────  │   (localhost:8000)       │
└─────────────────────┘                             └──────────────────────────┘
                                                                │
                                                                ▼
                                          ┌──────────────────────────────────┐
                                          │  SQLite (db/wordgame.db)         │
                                          │  games, words tables             │
                                          ├──────────────────────────────────┤
                                          │  In-memory dictionary Set        │
                                          │  (db/words.json, ~248k words,    │
                                          │  loaded once at startup)         │
                                          └──────────────────────────────────┘
```

The frontend never touches the database directly — every read/write goes
through the Express API. The dictionary is intentionally *not* a DB table:
at ~248k words, a `Set` lookup in memory is O(1) and avoids a disk-backed
query on every single word submission.

### Backend

```
backend/
├── server.js              Express app setup, JSON error handler, health check
├── db/
│   ├── database.js        SQLite connection + promise wrappers (run/get/all)
│   ├── dictionary.js      Loads words.json into a Set, exposes isValidWord()
│   └── words.json         ~248k word dictionary (data, not code)
├── routes/
│   └── gameRoutes.js       All /api/* route handlers
└── utils/
    ├── randomLetters.js    Scrabble-weighted letter generator (min/max vowels)
    └── scoring.js           Word length → score curve
```

**Request flow for submitting a word** (`POST /api/games/:id/words`):

1. `gameRoutes.js` loads the game row from SQLite and checks it's still active
   (auto-ending it server-side if the timer has expired since the last request).
2. The submitted word is checked against the game's letter pool (each letter
   can only be used as many times as it appears on the board).
3. It's checked against `words` already submitted for this game, to block
   duplicate scoring.
4. It's checked against the in-memory dictionary `Set` via `isValidWord()`.
5. If all checks pass, `scoring.js` computes the point value, the word is
   inserted into the `words` table, and the game's running `score` is updated.

**Database schema:**

| Table   | Columns |
|---------|---------|
| `games` | `id, player_name, letters, status, score, duration_seconds, started_at, ended_at, created_at, updated_at` |
| `words` | `id, game_id, word, score, created_at` |

`status` is `'active'` or `'ended'`. A game is auto-transitioned to `'ended'`
by the server (not the client) the moment any request arrives after its
timer has expired — the frontend's countdown is just a visual mirror of
that same `duration_seconds` / `started_at` math.

**API endpoints:**

| Method | Route | Purpose |
|--------|-------|---------|
| `GET`   | `/api/health` | Server + dictionary status |
| `POST`  | `/api/games` | Create a new game (generates letters, starts timer) |
| `GET`   | `/api/games/:id` | Fetch game state + time remaining |
| `GET`   | `/api/games/:id/words` | List words submitted for a game |
| `POST`  | `/api/games/:id/words` | Submit a word for validation + scoring |
| `PATCH` | `/api/games/:id/end` | End a game manually |
| `GET`   | `/api/leaderboard` | Top 10 scores across all ended games |

### Frontend

```
frontend/src/
├── App.js                     Screen state machine: landing → playing → results
├── api.js                     Axios instance (baseURL from REACT_APP_API_URL)
└── components/
    ├── NameEntry.js            Landing screen: title tiles, name input, leaderboard
    ├── GameBoard.js             Core gameplay: board, word tray, timer, submit logic
    ├── ResultsScreen.js         Post-game summary
    ├── LetterTile.js            Shared tile component (board / tray / title variants)
    └── Timer.js                 Countdown bar synced to server's started_at
```

`App.js` holds no game logic itself — it's a thin state machine that swaps
between the three screens and passes callbacks down:

```
NameEntry  --onStart(name)-->  App creates game via API  --> GameBoard
GameBoard  --onGameEnd(result)-->  App stores result  --> ResultsScreen
ResultsScreen  --onPlayAgain-->  App resets to NameEntry
```

`GameBoard.js` is where most of the client-side state lives:
- `boardTiles` — each of the 10 tiles tracked individually (by id, not just
  letter) so duplicate letters can be used independently and correctly
  re-enabled on backspace/clear.
- `currentWordTiles` — the word currently being built.
- `secondsRemaining` — recomputed every second from `Date.now() - startedAtMs`
  rather than a naive decrementing counter, so it stays accurate even if the
  browser tab is throttled in the background.
- On timeout or manual end, it calls `PATCH /games/:id/end` and hands the
  final score + word list up to `App.js`.

## What changed from the original code

**Backend**
- Dictionary went from 6 hardcoded words to a real ~248,000-word English
  dictionary, loaded into memory for instant lookups (`db/words.json` +
  `db/dictionary.js`).
- Database switched from `:memory:` to a file (`db/wordgame.db`), so games
  and scores survive a server restart.
- Added a real 2-minute game timer, duplicate-word rejection, letter-pool
  validation, and a `/api/leaderboard` endpoint.
- Letter generation now uses Scrabble-style weighted frequencies with a
  min/max vowel guardrail (3–5 vowels per board) instead of pure uniform
  randomness, so boards stay playable.
- All error responses are JSON now (the original returned raw strings,
  which is awkward to handle in the frontend).
- Removed the unused empty model files (`gameModel.js`, `wordModel.js`,
  `dictionaryModel.js`) and the `body-parser` dependency (Express's
  built-in `express.json()` replaces it).

**Frontend**
- Full redesign: tactile letter tiles, tap-to-build word tray, live
  countdown timer, found-words list, a proper name-entry screen (no more
  `window.prompt`), and a results screen.
- Error handling fixed (`err.response.data` could crash if the request
  failed before a response came back).
- API base URL is now configurable via `REACT_APP_API_URL` for production
  builds instead of being hardcoded to `localhost`.

## Running it locally

**Backend**
```bash
cd backend
npm install
npm start
```
Runs on `http://localhost:8000`. First boot loads the dictionary (~250k
words) into memory — that's normal and only takes a second.

**Frontend**
```bash
cd frontend
npm install
npm start
```
Runs on `http://localhost:3000` and talks to the backend automatically.

To run the frontend's test suite: `npm test` (inside `frontend/`).

## Notes / things to revisit later

- SQLite is fine for a single-instance hobby deploy but won't scale past
  that — if this grows, Postgres is the natural next step.
- There's no auth — anyone can end/query any game by ID. Fine for a casual
  game, worth locking down before this handles real user accounts.
- The dictionary is comprehensive but unfiltered, so it includes some
  obscure/archaic entries. If certain words feel wrong to accept, it's a
  one-line filter in the word list generation.
