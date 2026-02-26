import { useState, useEffect, useCallback } from 'react';
import Counter from './components/Counter';
import ClickButton from './components/ClickButton';
import Leaderboard from './components/Leaderboard';
import UsernameModal from './components/UsernameModal';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

export default function App() {
  // Core state
  const [userId, setUserId] = useState(null);
  const [clicks, setClicks] = useState(0);
  const [username, setUsername] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  // Modal is shown when the user first enters the Top 100 without a username
  const [showModal, setShowModal] = useState(false);
  const [modalError, setModalError] = useState('');

  // --------------------------------------------------------
  // On mount: restore session from localStorage, fetch state
  // --------------------------------------------------------
  useEffect(() => {
    const savedId = localStorage.getItem('clickerUserId');

    if (savedId) {
      // Restore existing user from backend
      fetch(`${API_BASE}/user/${savedId}`)
        .then((r) => r.json())
        .then((data) => {
          if (!data.error) {
            setUserId(data.userId);
            setClicks(data.clicks);
            setUsername(data.username);
          }
        })
        .catch(() => {}); // ignore network errors on load
    }

    // Always fetch a fresh leaderboard on load
    fetch(`${API_BASE}/leaderboard`)
      .then((r) => r.json())
      .then((data) => setLeaderboard(data.leaderboard ?? []))
      .catch(() => {});
  }, []);

  // --------------------------------------------------------
  // Handle button click
  // --------------------------------------------------------
  const handleClick = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();

      // If this is a brand-new user, save the generated userId
      if (!userId) {
        localStorage.setItem('clickerUserId', data.userId);
        setUserId(data.userId);
      }

      setClicks(data.clicks);
      setUsername(data.username);
      setLeaderboard(data.leaderboard ?? []);

      // Prompt for username if the user just entered the Top 100
      if (data.needsUsername) {
        setShowModal(true);
        setModalError('');
      }
    } catch (err) {
      console.error('Click failed:', err);
    }
  }, [userId]);

  // --------------------------------------------------------
  // Handle username submission from the modal
  // --------------------------------------------------------
  const handleUsernameSubmit = useCallback(
    async (inputUsername) => {
      setModalError('');
      try {
        const res = await fetch(`${API_BASE}/username`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, username: inputUsername }),
        });
        const data = await res.json();

        if (data.error) {
          setModalError(data.error);
          return;
        }

        setUsername(data.username);
        setLeaderboard(data.leaderboard ?? []);
        setShowModal(false);
      } catch (err) {
        setModalError('Something went wrong. Please try again.');
      }
    },
    [userId]
  );

  // --------------------------------------------------------
  // Render
  // --------------------------------------------------------
  return (
    <div className="app-layout">
      {/* Left / main area */}
      <div className="main-area">
        {/* Counter – top-left */}
        <Counter clicks={clicks} />

        {/* Centered click button */}
        <ClickButton onClick={handleClick} />
      </div>

      {/* Right sidebar – leaderboard */}
      <aside className="leaderboard-panel">
        <Leaderboard entries={leaderboard} currentUserId={userId} />
      </aside>

      {/* Username modal overlay */}
      {showModal && (
        <UsernameModal
          onSubmit={handleUsernameSubmit}
          error={modalError}
        />
      )}
    </div>
  );
}
