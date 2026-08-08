import React from 'react';

// Cosmetic Scrabble-style point values shown on each tile. Purely for flavor —
// actual scoring (done server-side) is based on total word length, not per-letter value.
const LETTER_POINTS = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8,
  K: 5, L: 1, M: 3, N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1,
  U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10,
};

const LetterTile = ({
  letter,
  onClick,
  disabled = false,
  variant = 'board', // 'board' | 'tray' | 'title'
  rotate = 0,
  showPoints = true,
}) => {
  const content = (
    <>
      <span className="tile-letter">{letter}</span>
      {showPoints && variant !== 'title' && (
        <span className="tile-points">{LETTER_POINTS[letter?.toUpperCase()] || ''}</span>
      )}
    </>
  );

  const style = rotate ? { transform: `rotate(${rotate}deg)` } : undefined;

  if (variant === 'title') {
    return (
      <span className={`tile tile--title`} style={style} aria-hidden="true">
        {content}
      </span>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        className={`tile tile--board${disabled ? ' tile--disabled' : ''}`}
        onClick={onClick}
        disabled={disabled}
      >
        {content}
      </button>
    );
  }

  return (
    <span className="tile tile--tray" style={style}>
      {content}
    </span>
  );
};

export default LetterTile;
