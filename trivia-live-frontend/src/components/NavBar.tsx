import { NavLink } from 'react-router-dom';
import { Home, Swords, Trophy, Zap } from 'lucide-react';
import type { UserProfile } from '../types';

const links = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/quick-play', label: 'Quick Play', icon: Zap, end: false },
  { to: '/live', label: 'Live', icon: Swords, end: false },
  { to: '/leaderboard', label: 'Ranks', icon: Trophy, end: false },
];

export function NavBar({ profile }: { profile: UserProfile | null }) {
  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-arcade-bg/80 border-b border-white/5">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
        <NavLink to="/" className="flex items-center gap-2 font-display font-bold text-lg tracking-tight">
          <span className="w-2 h-2 rounded-full bg-arcade-gold" />
          TRIVIO
        </NavLink>

        <nav className="hidden sm:flex items-center gap-1">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition ${
                  isActive
                    ? 'bg-arcade-surface2 text-arcade-gold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-arcade-surface'
                }`
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        {profile && (
          <div className="flex items-center gap-2 bg-arcade-surface border border-white/5 rounded-full pl-1 pr-3 py-1">
            <span className="w-6 h-6 rounded-full bg-arcade-violet flex items-center justify-center text-[11px] font-bold">
              {profile.displayName.slice(0, 1).toUpperCase()}
            </span>
            <span className="text-xs font-semibold text-slate-200 max-w-[100px] truncate">
              {profile.displayName}
            </span>
          </div>
        )}
      </div>

      {/* Mobile bottom-anchored nav */}
      <nav className="sm:hidden flex items-center justify-around border-t border-white/5 px-2 py-1">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide ${
                isActive ? 'text-arcade-gold' : 'text-slate-500'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
