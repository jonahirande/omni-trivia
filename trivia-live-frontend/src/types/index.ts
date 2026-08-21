// ---------- User / Profile ----------
export interface UserProfile {
  userId: string;
  displayName: string;
  countryCode?: string;
}

// ---------- Categories (REST) ----------
export interface Category {
  id: string;
  slug: string;
  name: string;
  iconUrl?: string;
  isKidsSafe: boolean;
}

// ---------- Leaderboard (REST) ----------
export type GameMode = 'quick_play' | 'adventure' | 'live_multiplayer';

export interface LeaderboardEntry {
  userId: string;
  displayName?: string;
  score: number;
  countryCode?: string;
  rank?: number;
}

// ---------- Match submission (REST) ----------
export interface SubmitMatchPayload {
  userId: string;
  gameMode: GameMode;
  score: number;
  countryCode?: string;
}

// ---------- Question (assumed shape broadcast by the realtime engine) ----------
// NOTE: the brief's socket contract does not specify the "question payload" event.
// Based on the earlier backend design (`question:start`), this is the assumed
// shape. Adjust `QUESTION_START_EVENT` in services/socket.ts if your engine
// uses a different event name or payload.
export interface LiveQuestion {
  questionId: string;
  categoryName: string;
  prompt: string;
  mediaUrl?: string;
  options?: { id: string; text: string }[];
  timeLimitSec: number;
  serverStartTs: number;
}

export type InputMode = 'multiple_choice' | 'direct_input';

// ---------- Socket.io payloads (per spec) ----------
export interface RoomJoinPayload {
  roomCode: string;
  userId: string;
}

export interface PlayerJoinedPayload {
  userId: string;
  socketId: string;
  displayName?: string;
}

export interface AnswerSubmitPayload {
  roomId: string;
  questionId: string;
  userId: string;
  selectedOptionId?: string;
  typedAnswer?: string;
  inputMode: InputMode;
}

export interface AnswerReceivedPayload {
  questionId: string;
  scoreEarned: number;
}

export interface LiveStanding {
  userId: string;
  score: number;
}

export interface LeaderboardUpdatePayload {
  standings: LiveStanding[];
}

export type ConnectionState = 'connecting' | 'connected' | 'disconnected';
