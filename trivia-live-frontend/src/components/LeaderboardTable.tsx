import { Crown, Medal, Loader2, AlertTriangle } from 'lucide-react';
import type { LeaderboardEntry } from '../types';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[] | null;
  loading: boolean;
  error: string | null;
  currentUserId?: string;
}

const RANK_STYLES = [
  { icon: Crown, className: 'text-arcade-gold' },
  { icon: Medal, className: 'text-slate-300' },
  { icon: Medal, className: 'text-orange-400' },
];

export function LeaderboardTable({ entries, loading, error, currentUserId }: LeaderboardTableProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-400 text-sm py-10 justify-center">
        <Loader2 size={16} className="animate-spin" /> Loading leaderboard…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-arcade-coral text-sm bg-arcade-coral/10 border border-arcade-coral/20 rounded-xl p-4">
        <AlertTriangle size={16} />
        Couldn't load the leaderboard ({error}).
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return <p className="text-sm text-slate-500 text-center py-10">No scores yet — be the first!</p>;
  }

  return (
    <ul className="space-y-2">
      {entries.map((entry, i) => {
        const rankStyle = RANK_STYLES[i];
        const isMe = entry.userId === currentUserId;
        return (
          <li
            key={entry.userId}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
              isMe ? 'border border-arcade-violet bg-arcade-violet/10' : 'card'
            }`}
          >
            <span className="w-6 text-center font-mono text-sm font-bold text-slate-500 flex items-center justify-center">
              {rankStyle ? <rankStyle.icon size={16} className={rankStyle.className} /> : i + 1}
            </span>
            <span className="w-8 h-8 rounded-full bg-arcade-surface3 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {(entry.displayName ?? entry.userId).slice(0, 1).toUpperCase()}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">
                {isMe ? 'You' : entry.displayName ?? entry.userId}
              </p>
              {entry.countryCode && <p className="text-[11px] text-slate-500">{entry.countryCode}</p>}
            </div>
            <span className="font-mono font-bold text-arcade-teal">{entry.score.toLocaleString()}</span>
          </li>
        );
      })}
    </ul>
  );
}
