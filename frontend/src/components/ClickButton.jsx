import { useState } from 'react';

// Main interactive button – fires the onClick callback on every press.
// A brief "pressed" animation is applied via CSS class toggling.
export default function ClickButton({ onClick }) {
  const [pressed, setPressed] = useState(false);

  const handleClick = () => {
    // Visual feedback: add .pressed class momentarily
    setPressed(true);
    setTimeout(() => setPressed(false), 120);
    onClick();
  };

  return (
    <button
      className={`click-btn${pressed ? ' click-btn--pressed' : ''}`}
      onClick={handleClick}
      aria-label="Click Me"
    >
      Click Me
    </button>
  );
}
