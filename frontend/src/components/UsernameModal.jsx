import { useState } from 'react';

// UsernameModal – shown when a user first enters the Top 100.
// Collects a family-friendly display name; delegates validation to the backend.
export default function UsernameModal({ onSubmit, error }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(input);
  };

  return (
    // Backdrop
    <div className="modal-backdrop">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <h2 id="modal-title" className="modal-title">You made the Top 100!</h2>
        <p className="modal-body">Enter a username to appear on the leaderboard.</p>

        <form onSubmit={handleSubmit} className="modal-form">
          <input
            className="modal-input"
            type="text"
            placeholder="Your username"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={20}
            autoFocus
          />

          {/* Server-side validation error message */}
          {error && <p className="modal-error">{error}</p>}

          <button className="modal-submit" type="submit">
            Save Username
          </button>
        </form>

        <p className="modal-hint">Max 20 chars · letters, numbers, spaces, _ and - only</p>
      </div>
    </div>
  );
}
