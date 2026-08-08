import React from 'react';

const ResultsScreen = ({ playerName, score, submittedWords, onPlayAgain }) => {
  const best = [...submittedWords].sort((a, b) => b.score - a.score)[0];

  return (
    <div className="screen screen--results">
      <div className="results-card">
        <span className="results-eyebrow">Time's up</span>
        <h1 className="results-score">{score}</h1>
        <p className="results-sub">
          points — nice work, {playerName}
        </p>

        {best && (
          <p className="results-best">
            Best word: <strong>{best.word}</strong> (+{best.score})
          </p>
        )}

        <div className="results-words">
          {submittedWords.length === 0 ? (
            <p className="found-words-empty">No words found this round — give it another go.</p>
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

        <button className="btn btn--primary btn--lg" onClick={onPlayAgain}>
          Play again
        </button>
      </div>
    </div>
  );
};

export default ResultsScreen;
