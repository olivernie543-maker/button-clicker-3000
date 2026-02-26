// Counter – displayed in the top-left corner of the page.
// Shows the current user's total click count.
export default function Counter({ clicks }) {
  return (
    <div className="counter">
      <span className="counter-label">Clicks</span>
      <span className="counter-value">{clicks.toLocaleString()}</span>
    </div>
  );
}
