import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'ws://localhost:4000';

// ---- Event name constants (single source of truth) ----
// Matches the backend contract in the brief. `QUESTION_START` / `QUESTION_END`
// are assumed event names for the question broadcast — rename here if your
// realtime engine differs, no other file needs to change.
export const SOCKET_EVENTS = {
  ROOM_JOIN: 'room:join',
  PLAYER_JOINED: 'room:playerJoined',
  PLAYER_LIST: 'room:playerList',
  QUESTION_START: 'question:start',
  QUESTION_END: 'question:end',
  ANSWER_SUBMIT: 'answer:submit',
  ANSWER_RECEIVED: 'answer:received',
  LEADERBOARD_UPDATE: 'leaderboard:update',
  MATCH_END: 'match:end',
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
} as const;

let socket: Socket | null = null;

/**
 * Lazily creates (or returns the existing) singleton socket instance.
 * `autoConnect: false` — connection is kicked off explicitly by useSocket()
 * so we control exactly when the user "enters" realtime mode.
 */
export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
}
