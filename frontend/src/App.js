import React, { useState, useEffect, useCallback } from 'react';
import API from './api';
import NameEntry from './components/NameEntry';
import GameBoard from './components/GameBoard';
import ResultsScreen from './components/ResultsScreen';
import './App.css';

function App() {
  const [screen, setScreen] = useState('landing'); // 'landing' | 'playing' | 'results'
  const [game, setGame] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  const loadLeaderboard = useCallback(() => {
    API.get('/leaderboard')
      .then((res) => setLeaderboard(res.data))
      .catch(() => setLeaderboard([]));
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const startGame = async (playerName) => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.post('/games', { player_name: playerName });
      setGame(res.data);
      setScreen('playing');
    } catch (err) {
      setError(err.response?.data?.error || "Couldn't reach the game server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const handleGameEnd = ({ score, submittedWords }) => {
    setResults({ score, submittedWords, playerName: game.player_name });
    setScreen('results');
    loadLeaderboard();
  };

  const playAgain = () => {
    setGame(null);
    setResults(null);
    setScreen('landing');
  };

  return (
    <div className="app">
      {screen === 'landing' && (
        <NameEntry onStart={startGame} loading={loading} error={error} leaderboard={leaderboard} />
      )}
      {screen === 'playing' && game && <GameBoard game={game} onGameEnd={handleGameEnd} />}
      {screen === 'results' && results && (
        <ResultsScreen
          playerName={results.playerName}
          score={results.score}
          submittedWords={results.submittedWords}
          onPlayAgain={playAgain}
        />
      )}
    </div>
  );
}

export default App;
