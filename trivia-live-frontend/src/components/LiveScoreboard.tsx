import { Trophy } from 'lucide-react';
import type { LiveStanding } from '../types';

interface LiveScoreboardProps {
  standings: LiveStanding[];
  currentUserId: string;
  players: { userId: string; displayName?: string }[];
}

export function LiveScoreboard({ standings, currentUserId, players }: LiveScoreboardProps) {
  const nameFor = (userId: string) =>
    players.find((p) => p.userId === userId)?.displayName ?? userId.slice(0, 8);

  if (standings.length === 0) {
    return (
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Trophy size={15} className="text-arcade-gold" />
          <h3 className="font-display font-bold text-sm">Live standings</h3>
        </div>
        <p className="text-xs text-slate-500">Standings appear once the first round ends.</p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Trophy size={15} className="text-arcade-gold" />
        <h3 className="font-display font-bold text-sm">Live standings</h3>
      </div>
      <ul className="space-y-1.5">
        {standings.map((s, i) => (
          <li
            key={s.userId}
            className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-all duration-300 ${
              s.userId === currentUserId ? 'bg-arcade-violet/15 border border-arcade-violet/30' : ''
            }`}
          >
            <span
              className={`font-mono text-xs font-bold w-5 text-center ${
                i === 0 ? 'text-arcade-gold' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-orange-400' : 'text-slate-500'
              }`}
            >
              {i + 1}
            </span>
            <span className="text-xs font-semibold truncate flex-1">
              {s.userId === currentUserId ? 'You' : nameFor(s.userId)}
            </span>
            <span className="font-mono text-xs font-bold text-arcade-gold">{s.score}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
