# Button Clicker 3000

A minimal interactive web app with a clickable button, a live click counter, and a real-time Top 100 leaderboard.

---

## Project Structure

```
button-clicker-3000/
├── backend/          # Node.js / Express API
│   ├── server.js
│   └── package.json
└── frontend/         # React + Vite UI
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── App.css
        └── components/
            ├── Counter.jsx
            ├── ClickButton.jsx
            ├── Leaderboard.jsx
            └── UsernameModal.jsx
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- npm (comes with Node.js)

---

## Running Locally

You need **two terminal windows** — one for the backend, one for the frontend.

### 1. Start the Backend

```bash
cd button-clicker-3000/backend
npm install
npm start
```

The API server starts at **http://localhost:3001**.

For auto-restart during development:

```bash
npm run dev   # uses nodemon
```

### 2. Start the Frontend

Open a second terminal:

```bash
cd button-clicker-3000/frontend
npm install
npm run dev
```

The React app starts at **http://localhost:3000**.
Vite proxies all `/api` requests to the backend automatically.

---

## How It Works

| Feature | Details |
|---|---|
| Click counter | Each button press calls `POST /api/click`; the counter updates instantly. |
| Session | A UUID is generated on your first click and stored in `localStorage`. |
| Leaderboard | Updated after every click; shows Top 100 users who have set a username. |
| Username prompt | When your click count puts you in the Top 100, a modal appears asking for a name. |
| Validation | Usernames are validated server-side: no profanity, no duplicates, max 20 chars. |

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/click` | Increment click count. Body: `{ userId? }` |
| `GET` | `/api/leaderboard` | Fetch Top 100 leaderboard. |
| `POST` | `/api/username` | Set a username. Body: `{ userId, username }` |
| `GET` | `/api/user/:userId` | Get a user's current state. |

---

## Notes

- All data is stored **in memory** — it resets when the backend restarts. To persist data, replace the `users` Map in `server.js` with a database adapter (e.g., SQLite, PostgreSQL).
- The frontend uses a Vite proxy in development. For production, configure CORS on the backend and point the frontend to the deployed API URL.
