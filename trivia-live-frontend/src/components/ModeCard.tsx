import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight } from 'lucide-react';

interface ModeCardProps {
  to: string;
  icon: LucideIcon;
  tag: string;
  title: string;
  description: string;
  accent: 'gold' | 'violet' | 'pink';
  live?: boolean;
}

const ACCENTS = {
  gold: { tag: 'text-arcade-gold bg-arcade-gold/10', glow: 'hover:border-arcade-gold/40' },
  violet: { tag: 'text-arcade-violet bg-arcade-violet/10', glow: 'hover:border-arcade-violet/40' },
  pink: { tag: 'text-arcade-pink bg-arcade-pink/10', glow: 'hover:border-arcade-pink/40' },
};

export function ModeCard({ to, icon: Icon, tag, title, description, accent, live }: ModeCardProps) {
  const a = ACCENTS[accent];
  return (
    <Link
      to={to}
      className={`card relative block p-5 transition border border-white/5 ${a.glow} hover:-translate-y-0.5`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide rounded-full px-2.5 py-1 ${a.tag}`}>
          {live && <span className="w-1.5 h-1.5 rounded-full bg-arcade-pink animate-pulseGlow" />}
          {tag}
        </span>
        <Icon size={20} className="text-slate-500" />
      </div>
      <h3 className="font-display font-bold text-lg mb-1">{title}</h3>
      <p className="text-sm text-slate-400 pr-6">{description}</p>
      <ChevronRight size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600" />
    </Link>
  );
}
