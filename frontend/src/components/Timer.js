import React from 'react';

const Timer = ({ secondsRemaining, totalSeconds }) => {
  const pct = Math.max(0, Math.min(100, (secondsRemaining / totalSeconds) * 100));
  const isLow = secondsRemaining <= 15;
  const mm = Math.floor(secondsRemaining / 60);
  const ss = String(secondsRemaining % 60).padStart(2, '0');

  return (
    <div className={`timer${isLow ? ' timer--low' : ''}`}>
      <div className="timer-track">
        <div className="timer-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="timer-label">
        {mm}:{ss}
      </span>
    </div>
  );
};

export default Timer;
