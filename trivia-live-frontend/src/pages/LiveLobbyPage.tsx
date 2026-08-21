import { useState } from 'react';
import { Play, Trophy } from 'lucide-react';
import { RoomJoinForm } from '../components/RoomJoinForm';
import { PlayerList } from '../components/PlayerList';
import { ConnectionBadge } from '../components/ConnectionBadge';
import { GamePage } from './GamePage';
import { useSocket } from '../hooks/useSocket';
import type { UserProfile } from '../types';

export function LiveLobbyPage({ profile }: { profile: UserProfile }) {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [ended, setEnded] = useState(false);

  const { connectionState, players, currentQuestion, lastScore, standings, joinRoom, submitAnswer } =
    useSocket();

  const handleJoin = (code: string) => {
    setRoomCode(code);
    joinRoom(code, profile.userId);
  };

  // ---------- Step 1: not in a room yet ----------
  if (!roomCode) {
    return (
      <div className="max-w-md mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-2xl font-bold">Live Multiplayer</h1>
          <ConnectionBadge state={connectionState} />
        </div>
        <RoomJoinForm onJoin={handleJoin} disabled={connectionState !== 'connected'} />
      </div>
    );
  }

  // ---------- Step 3: match ended ----------
  if (ended) {
    const myRank = standings.findIndex((s) => s.userId === profile.userId) + 1;
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-arcade-pink/15 text-arcade-pink flex items-center justify-center mb-4">
          <Trophy size={28} />
        </div>
        <h1 className="font-display text-2xl font-bold mb-1">Match over!</h1>
        <p className="text-slate-400 text-sm mb-6">
          {myRank > 0 ? `You finished #${myRank}` : 'Thanks for playing!'}
        </p>
        <button
          onClick={() => {
            setRoomCode(null);
            setEnded(false);
          }}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <Play size={16} />
          Join another room
        </button>
      </div>
    );
  }

  // ---------- Step 2b: a question is live — hand off to GamePage ----------
  if (currentQuestion) {
    return (
      <GamePage
        roomId={roomCode}
        question={currentQuestion}
        lastScore={lastScore}
        standings={standings}
        players={players}
        profile={profile}
        onSubmitAnswer={submitAnswer}
      />
    );
  }

  // ---------- Step 2a: in the room, waiting for the host to start ----------
  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Room {roomCode}</h1>
          <p className="text-xs text-slate-500">Share this code so friends can join.</p>
        </div>
        <ConnectionBadge state={connectionState} />
      </div>

      <PlayerList players={players} roomCode={roomCode} />

      <p className="text-center text-xs text-slate-500 mt-6">
        Waiting for the host to start the match — the first question appears here automatically.
      </p>
    </div>
  );
}
