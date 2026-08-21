import { Zap, Swords, Trophy } from 'lucide-react';
import { ModeCard } from '../components/ModeCard';
import type { UserProfile } from '../types';

export function HomePage({ profile }: { profile: UserProfile }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="font-display text-2xl font-bold mb-1">Welcome back, {profile.displayName} 👋</h1>
      <p className="text-slate-400 text-sm mb-8">Pick a mode to jump in.</p>

      <div className="grid gap-3">
        <ModeCard
          to="/quick-play"
          icon={Zap}
          tag="30s to start"
          title="Quick Play"
          description="Instant single-player match — pick a category and go."
          accent="gold"
        />
        <ModeCard
          to="/live"
          icon={Swords}
          tag="rooms open now"
          title="Live Multiplayer"
          description="Real-time speed quiz. Fastest correct answer wins the round."
          accent="pink"
          live
        />
        <ModeCard
          to="/leaderboard"
          icon={Trophy}
          tag="global + country"
          title="Leaderboard"
          description="See how you stack up worldwide and in your country."
          accent="violet"
        />
      </div>
    </div>
  );
}
