import React, { useState } from 'react';
import LetterTile from './LetterTile';

const TITLE_LETTERS = [
  { l: 'T', r: -6 },
  { l: 'I', r: 4 },
  { l: 'L', r: -3 },
  { l: 'E', r: 7 },
  { l: 'R', r: -8 },
  { l: 'U', r: 3 },
  { l: 'S', r: -4 },
  { l: 'H', r: 6 },
];

const NameEntry = ({ onStart, loading, error, leaderboard }) => {
  const [name, setName] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onStart(trimmed);
  };

  return (
    <div className="screen screen--landing">
      <div className="landing-hero">
        <div className="title-tiles">
          {TITLE_LETTERS.map((t, i) => (
            <LetterTile key={i} letter={t.l} variant="title" rotate={t.r} />
          ))}
        </div>
        <p className="landing-tagline">
          Ten letters. Two minutes. Build every word you can find.
        </p>
      </div>

      <form className="landing-form" onSubmit={submit}>
        <label htmlFor="player-name" className="landing-label">
          Your name
        </label>
        <input
          id="player-name"
          className="landing-input"
          type="text"
          value={name}
          maxLength={24}
          placeholder="e.g. Roor"
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        {error && <p className="landing-error">{error}</p>}
        <button type="submit" className="btn btn--primary btn--lg" disabled={loading || !name.trim()}>
          {loading ? 'Shuffling tiles…' : 'Start game'}
        </button>
      </form>

      {leaderboard && leaderboard.length > 0 && (
        <div className="leaderboard">
          <h2 className="leaderboard-title">Top scores</h2>
          <ol className="leaderboard-list">
            {leaderboard.map((row, i) => (
              <li key={i} className="leaderboard-row">
                <span className="leaderboard-rank">{i + 1}</span>
                <span className="leaderboard-name">{row.player_name}</span>
                <span className="leaderboard-score">{row.score}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};

export default NameEntry;
