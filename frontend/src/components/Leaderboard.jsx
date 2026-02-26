// Leaderboard – right-side panel showing the Top 100 clickers.
// Highlights the current user's row if they appear in the list.
export default function Leaderboard({ entries, currentUserId }) {
  return (
    <div className="leaderboard">
      <h2 className="leaderboard-title">Most Clicks</h2>

      {entries.length === 0 ? (
        <p className="leaderboard-empty">No scores yet. Start clicking!</p>
      ) : (
        <ol className="leaderboard-list">
          {entries.map((entry) => (
            <li
              key={entry.userId}
              className={`leaderboard-row${entry.userId === currentUserId ? ' leaderboard-row--me' : ''}`}
            >
              <span className="leaderboard-rank">{entry.rank}.</span>
              <span className="leaderboard-name">{entry.username}</span>
              <span className="leaderboard-score">
                {entry.clicks.toLocaleString()}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
