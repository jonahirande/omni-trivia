import { Users } from 'lucide-react';
import type { PlayerJoinedPayload } from '../types';

export function PlayerList({ players, roomCode }: { players: PlayerJoinedPayload[]; roomCode: string }) {
  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-arcade-violet" />
          <h2 className="font-display font-bold text-base">Players</h2>
        </div>
        <span className="font-mono text-xs text-slate-400 bg-arcade-surface2 rounded-full px-2.5 py-1">
          {players.length} joined
        </span>
      </div>

      {players.length === 0 ? (
        <p className="text-sm text-slate-500 py-6 text-center">
          Waiting for players to join room <span className="font-mono text-arcade-gold">{roomCode}</span>…
        </p>
      ) : (
        <ul className="space-y-2">
          {players.map((p, i) => (
            <li
              key={p.userId}
              className="flex items-center gap-3 bg-arcade-surface2 rounded-xl px-3 py-2 animate-slideIn"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <span className="w-8 h-8 rounded-full bg-arcade-violet/80 flex items-center justify-center text-xs font-bold">
                {(p.displayName ?? p.userId).slice(0, 1).toUpperCase()}
              </span>
              <span className="text-sm font-semibold truncate flex-1">
                {p.displayName ?? p.userId}
              </span>
              <span className="w-2 h-2 rounded-full bg-arcade-teal" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
