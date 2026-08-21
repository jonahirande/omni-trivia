import { useState } from 'react';
import { Globe, MapPin } from 'lucide-react';
import { LeaderboardTable } from '../components/LeaderboardTable';
import { useLeaderboard } from '../hooks/useTriviaApi';
import type { GameMode, UserProfile } from '../types';

const MODES: { value: GameMode; label: string }[] = [
  { value: 'quick_play', label: 'Quick Play' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'live_multiplayer', label: 'Live Multiplayer' },
];

export function LeaderboardPage({ profile }: { profile: UserProfile }) {
  const [mode, setMode] = useState<GameMode>('quick_play');
  const [scope, setScope] = useState<'global' | 'country'>('global');

  const { data, loading, error } = useLeaderboard(mode, scope === 'country' ? profile.countryCode ?? '' : '');

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="font-display text-2xl font-bold mb-1">Leaderboard</h1>
      <p className="text-slate-400 text-sm mb-6">Top players across Trivio.</p>

      <div className="flex gap-2 mb-3">
        {MODES.map((m) => (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            className={`flex-1 text-xs font-bold rounded-lg px-2 py-2 transition ${
              mode === m.value ? 'bg-arcade-violet text-white' : 'bg-arcade-surface text-slate-400'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="flex bg-arcade-surface rounded-full p-1 text-xs font-bold w-fit mb-6">
        <button
          onClick={() => setScope('global')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition ${
            scope === 'global' ? 'bg-arcade-gold text-arcade-deep' : 'text-slate-400'
          }`}
        >
          <Globe size={13} />
          Global
        </button>
        <button
          onClick={() => setScope('country')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition ${
            scope === 'country' ? 'bg-arcade-gold text-arcade-deep' : 'text-slate-400'
          }`}
        >
          <MapPin size={13} />
          {profile.countryCode ?? 'Country'}
        </button>
      </div>

      <LeaderboardTable entries={data} loading={loading} error={error} currentUserId={profile.userId} />
    </div>
  );
}
