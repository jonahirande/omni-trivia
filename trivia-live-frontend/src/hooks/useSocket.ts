import { useCallback, useEffect, useRef, useState } from 'react';
import { getSocket, SOCKET_EVENTS } from '../services/socket';
import type {
  AnswerReceivedPayload,
  AnswerSubmitPayload,
  ConnectionState,
  LeaderboardUpdatePayload,
  LiveQuestion,
  LiveStanding,
  PlayerJoinedPayload,
} from '../types';

interface UseSocketOptions {
  /** Connect immediately on mount. Defaults to true. */
  autoConnect?: boolean;
}

/**
 * Central realtime hook. Owns the socket connection lifecycle and exposes:
 * - connectionState: 'connecting' | 'connected' | 'disconnected'
 * - players: roster built up from room:playerJoined events
 * - currentQuestion / lastScore: gameplay state driven by the server
 * - standings: latest leaderboard:update payload
 * - joinRoom / submitAnswer: outgoing actions
 */
export function useSocket(options: UseSocketOptions = {}) {
  const { autoConnect = true } = options;
  const socketRef = useRef(getSocket());

  const [connectionState, setConnectionState] = useState<ConnectionState>('connecting');
  const [players, setPlayers] = useState<PlayerJoinedPayload[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<LiveQuestion | null>(null);
  const [lastScore, setLastScore] = useState<AnswerReceivedPayload | null>(null);
  const [standings, setStandings] = useState<LiveStanding[]>([]);

  useEffect(() => {
    const socket = socketRef.current;

    const handleConnect = () => setConnectionState('connected');
    const handleDisconnect = () => setConnectionState('disconnected');
    const handleConnectError = () => setConnectionState('disconnected');

    const handlePlayerJoined = (payload: PlayerJoinedPayload) => {
      setPlayers((prev) => {
        if (prev.some((p) => p.userId === payload.userId)) return prev;
        return [...prev, payload];
      });
    };

    const handleQuestionStart = (payload: LiveQuestion) => {
      setCurrentQuestion(payload);
      setLastScore(null);
    };

    const handleQuestionEnd = () => {
      setCurrentQuestion(null);
    };

    const handleAnswerReceived = (payload: AnswerReceivedPayload) => {
      setLastScore(payload);
    };

    const handleLeaderboardUpdate = (payload: LeaderboardUpdatePayload) => {
      setStandings([...payload.standings].sort((a, b) => b.score - a.score));
    };

    socket.on(SOCKET_EVENTS.CONNECT, handleConnect);
    socket.on(SOCKET_EVENTS.DISCONNECT, handleDisconnect);
    socket.on(SOCKET_EVENTS.CONNECT_ERROR, handleConnectError);
    socket.on(SOCKET_EVENTS.PLAYER_JOINED, handlePlayerJoined);
    socket.on(SOCKET_EVENTS.QUESTION_START, handleQuestionStart);
    socket.on(SOCKET_EVENTS.QUESTION_END, handleQuestionEnd);
    socket.on(SOCKET_EVENTS.ANSWER_RECEIVED, handleAnswerReceived);
    socket.on(SOCKET_EVENTS.LEADERBOARD_UPDATE, handleLeaderboardUpdate);

    if (autoConnect && !socket.connected) {
      setConnectionState('connecting');
      socket.connect();
    } else if (socket.connected) {
      setConnectionState('connected');
    }

    return () => {
      socket.off(SOCKET_EVENTS.CONNECT, handleConnect);
      socket.off(SOCKET_EVENTS.DISCONNECT, handleDisconnect);
      socket.off(SOCKET_EVENTS.CONNECT_ERROR, handleConnectError);
      socket.off(SOCKET_EVENTS.PLAYER_JOINED, handlePlayerJoined);
      socket.off(SOCKET_EVENTS.QUESTION_START, handleQuestionStart);
      socket.off(SOCKET_EVENTS.QUESTION_END, handleQuestionEnd);
      socket.off(SOCKET_EVENTS.ANSWER_RECEIVED, handleAnswerReceived);
      socket.off(SOCKET_EVENTS.LEADERBOARD_UPDATE, handleLeaderboardUpdate);
    };
  }, [autoConnect]);

  const joinRoom = useCallback((roomCode: string, userId: string) => {
    socketRef.current.emit(SOCKET_EVENTS.ROOM_JOIN, { roomCode, userId });
  }, []);

  const submitAnswer = useCallback((payload: AnswerSubmitPayload) => {
    socketRef.current.emit(SOCKET_EVENTS.ANSWER_SUBMIT, payload);
  }, []);

  return {
    connectionState,
    players,
    currentQuestion,
    lastScore,
    standings,
    joinRoom,
    submitAnswer,
    socket: socketRef.current,
  };
}
