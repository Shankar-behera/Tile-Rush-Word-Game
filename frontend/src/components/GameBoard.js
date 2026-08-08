import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import API from '../api';
import LetterTile from './LetterTile';
import Timer from './Timer';

const GameBoard = ({ game, onGameEnd }) => {
  // Each board tile is tracked individually (not just by character) so duplicate
  // letters (e.g. two E's) can be used independently and re-enabled correctly.
  const [boardTiles, setBoardTiles] = useState(() =>
    game.letters.split('').map((letter, i) => ({ id: i, letter, used: false }))
  );
  const [currentWordTiles, setCurrentWordTiles] = useState([]); // [{ id, letter }]
  const [score, setScore] = useState(game.score || 0);
  const [submittedWords, setSubmittedWords] = useState([]);
  const [message, setMessage] = useState(null); // { type: 'error' | 'success', text }
  const [submitting, setSubmitting] = useState(false);
  const [ending, setEnding] = useState(false);
  const endedRef = useRef(false);

  const startedAtMs = useMemo(() => new Date(game.started_at).getTime(), [game.started_at]);
  const [secondsRemaining, setSecondsRemaining] = useState(game.duration_seconds);

  const currentWord = currentWordTiles.map((t) => t.letter).join('');

  const finishGame = useCallback(
    async (reason) => {
      if (endedRef.current) return;
      endedRef.current = true;
      setEnding(true);
      try {
        await API.patch(`/games/${game.id}/end`);
      } catch (err) {
        // Even if the network call fails, still let the player see their results.
        console.error('Failed to notify server game ended', err);
      }
      onGameEnd({ score, submittedWords, reason });
    },
    [game.id, score, submittedWords, onGameEnd]
  );

  // Countdown driven by wall-clock time, not a naive setInterval decrement,
  // so it stays accurate even if the tab is backgrounded and throttled.
  useEffect(() => {
    const tick = () => {
      const elapsed = Math.floor((Date.now() - startedAtMs) / 1000);
      const remaining = Math.max(0, game.duration_seconds - elapsed);
      setSecondsRemaining(remaining);
      if (remaining <= 0) {
        finishGame('timeout');
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startedAtMs, game.duration_seconds, finishGame]);

  const addLetter = (tile) => {
    if (tile.used || submitting) return;
    setBoardTiles((prev) => prev.map((t) => (t.id === tile.id ? { ...t, used: true } : t)));
    setCurrentWordTiles((prev) => [...prev, tile]);
    setMessage(null);
  };

  const backspace = () => {
    if (currentWordTiles.length === 0) return;
    const last = currentWordTiles[currentWordTiles.length - 1];
    setCurrentWordTiles((prev) => prev.slice(0, -1));
    setBoardTiles((prev) => prev.map((t) => (t.id === last.id ? { ...t, used: false } : t)));
    setMessage(null);
  };

  const clearWord = () => {
    const usedIds = new Set(currentWordTiles.map((t) => t.id));
    setBoardTiles((prev) => prev.map((t) => (usedIds.has(t.id) ? { ...t, used: false } : t)));
    setCurrentWordTiles([]);
    setMessage(null);
  };

  const submitWord = async () => {
    if (currentWord.length < 2 || submitting) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await API.post(`/games/${game.id}/words`, { word: currentWord });
      setScore(res.data.total_score);
      setSubmittedWords((prev) => [{ word: res.data.word, score: res.data.score }, ...prev]);
      setMessage({ type: 'success', text: `+${res.data.score} for "${res.data.word}"` });
      clearWord();
    } catch (err) {
      const text = err.response?.data?.error || 'Something went wrong submitting that word.';
      setMessage({ type: 'error', text });
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter') submitWord();
      if (e.key === 'Backspace') backspace();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentWord, submitting]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="screen screen--game">
      <div className="game-topbar">
        <div className="game-player">
          <span className="game-player-label">Player</span>
          <span className="game-player-name">{game.player_name}</span>
        </div>
        <Timer secondsRemaining={secondsRemaining} totalSeconds={game.duration_seconds} />
        <div className="game-score">
          <span className="game-score-label">Score</span>
          <span className="game-score-value">{score}</span>
        </div>
      </div>

      <div className="word-tray" aria-live="polite">
        {currentWordTiles.length === 0 ? (
          <span className="word-tray-placeholder">Tap letters to build a word</span>
        ) : (
          currentWordTiles.map((t, i) => <LetterTile key={`${t.id}-${i}`} letter={t.letter} variant="tray" />)
        )}
      </div>

      {message && <div className={`toast toast--${message.type}`}>{message.text}</div>}

      <div className="board">
        {boardTiles.map((tile) => (
          <LetterTile
            key={tile.id}
            letter={tile.letter}
            disabled={tile.used}
            onClick={() => addLetter(tile)}
          />
        ))}
      </div>

      <div className="board-actions">
        <button className="btn btn--ghost" onClick={backspace} disabled={currentWordTiles.length === 0}>
          ⌫ Delete
        </button>
        <button className="btn btn--ghost" onClick={clearWord} disabled={currentWordTiles.length === 0}>
          Clear
        </button>
        <button
          className="btn btn--primary"
          onClick={submitWord}
          disabled={currentWord.length < 2 || submitting}
        >
          {submitting ? 'Checking…' : 'Submit word'}
        </button>
      </div>

      <div className="found-words">
        <h2 className="found-words-title">
          Words found <span className="found-words-count">({submittedWords.length})</span>
        </h2>
        {submittedWords.length === 0 ? (
          <p className="found-words-empty">Nothing yet — find your first word above.</p>
        ) : (
          <ul className="found-words-list">
            {submittedWords.map((w, i) => (
              <li key={i} className="found-word-chip">
                <span>{w.word}</span>
                <span className="found-word-score">+{w.score}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button className="btn btn--text end-game-btn" onClick={() => finishGame('manual')} disabled={ending}>
        End game
      </button>
    </div>
  );
};

export default GameBoard;
