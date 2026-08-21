interface TimerBarProps {
  remainingSec: number;
  percentRemaining: number;
}

export function TimerBar({ remainingSec, percentRemaining }: TimerBarProps) {
  const colorClass =
    percentRemaining > 50 ? 'bg-arcade-teal' : percentRemaining > 25 ? 'bg-arcade-gold' : 'bg-arcade-coral';

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Time left</span>
        <span
          className={`font-mono text-sm font-bold transition-colors ${
            percentRemaining <= 25 ? 'text-arcade-coral animate-shake' : 'text-slate-200'
          }`}
        >
          {remainingSec.toFixed(1)}s
        </span>
      </div>
      <div className="h-3 w-full bg-arcade-surface2 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-[width] duration-100 ease-linear ${colorClass}`}
          style={{ width: `${percentRemaining}%` }}
        />
      </div>
    </div>
  );
}
