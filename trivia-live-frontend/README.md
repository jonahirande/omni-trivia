# Trivio Live — Frontend

A React + TypeScript + Vite single-page app for a live trivia game, wired to:

- **REST API** on `http://localhost:3000` (`/categories`, `/leaderboard`, `/matches`)
- **Socket.io realtime engine** on `ws://localhost:4000` (`room:join`, `room:playerJoined`, `answer:submit`, `answer:received`, `leaderboard:update`)

## Folder structure

```
src/
  types/           Shared TypeScript interfaces (REST + socket payloads)
  services/
    api.ts         Thin fetch wrapper for the REST API
    socket.ts       Singleton socket.io-client instance + event name constants
  hooks/
    useLocalStorage.ts   Generic persisted state (used for the user profile)
    useTriviaApi.ts      useCategories / useLeaderboard / useSubmitMatch
    useSocket.ts         Connection lifecycle, room state, question state, standings
    useCountdown.ts      Server-time-anchored countdown for the timer bar
  components/       Presentational, reusable pieces (buttons, cards, lists…)
  pages/            Route-level views composed from components + hooks
  App.tsx           Profile gate + react-router routes
  main.tsx          Entry point
```

## 1. Install

```bash
npm create vite@latest trivio-live-frontend -- --template react-ts
# then replace the generated src/ and config files with the ones provided here,
# OR if you were handed this folder as-is, just:
cd trivia-live-frontend
npm install
```

## 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` if your backend runs on different hosts/ports:

```
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=ws://localhost:4000
```

## 3. Run

Make sure your two backend services (REST API on :3000, Socket.io engine on :4000) are running, then:

```bash
npm run dev
```

Open the printed local URL (defaults to `http://localhost:5173`).

## 4. Build for production

```bash
npm run build
npm run preview   # serve the production build locally
```

## Notes / assumptions made against the brief

1. **Question broadcast event.** The brief specifies `answer:submit` / `answer:received` /
   `leaderboard:update`, but not the event the server uses to push a new question to the
   room. `useSocket.ts` listens for `question:start` (payload: `LiveQuestion` in
   `src/types/index.ts`) and `question:end`. If your engine uses different event names,
   change the two constants in `src/services/socket.ts` — nothing else needs to change.
2. **Quick Play questions.** The brief's REST contract only covers categories, leaderboard,
   and match submission — there's no "fetch questions" endpoint. `QuickPlayPage.tsx` ships
   with a small local mock question bank so the flow is fully playable end-to-end; swap
   `MOCK_QUESTIONS` for a real fetch once that endpoint exists.
3. **Correctness signal.** `answer:received` only returns `scoreEarned`, not whether the
   answer was right. The UI treats `scoreEarned > 0` as "correct" for highlighting purposes.
4. **Room ID vs room code.** `answer:submit` expects a `roomId`; the lobby UI collects a
   4-letter `roomCode`. The app currently passes the room code through as the room ID —
   update `LiveLobbyPage.tsx` if your backend returns a separate canonical room ID on join.

## Tech stack

- React 18 + TypeScript, built with Vite
- Tailwind CSS (custom "arcade" theme — see `tailwind.config.js`)
- `socket.io-client` for realtime
- `react-router-dom` for client-side routing
- `lucide-react` for icons
