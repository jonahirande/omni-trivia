import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import type { ConnectionState } from '../types';

const CONFIG: Record<ConnectionState, { label: string; className: string; icon: JSX.Element }> = {
  connecting: {
    label: 'Connecting…',
    className: 'text-arcade-gold bg-arcade-gold/10 border-arcade-gold/30',
    icon: <Loader2 size={12} className="animate-spin" />,
  },
  connected: {
    label: 'Live',
    className: 'text-arcade-teal bg-arcade-teal/10 border-arcade-teal/30',
    icon: <Wifi size={12} />,
  },
  disconnected: {
    label: 'Offline',
    className: 'text-arcade-coral bg-arcade-coral/10 border-arcade-coral/30',
    icon: <WifiOff size={12} />,
  },
};

export function ConnectionBadge({ state }: { state: ConnectionState }) {
  const cfg = CONFIG[state];
  return (
    <span
      className={`inline-flex items-center gap-1.5 border rounded-full px-2.5 py-1 text-[11px] font-semibold ${cfg.className}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}
