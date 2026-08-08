import { render, screen } from '@testing-library/react';
import App from './App';

// No backend is running in the test environment, so the leaderboard fetch
// in App's useEffect will reject - that's fine, App already catches it and
// falls back to an empty leaderboard. We only assert the landing UI renders.

test('renders the landing screen with a start button', () => {
  render(<App />);
  const startButton = screen.getByRole('button', { name: /start game/i });
  expect(startButton).toBeInTheDocument();
});
