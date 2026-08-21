import { useEffect, useRef, useState } from 'react';

interface UseCountdownResult {
  remainingSec: number;
  percentRemaining: number; // 0–100, for width/scale-driven UI
  isExpired: boolean;
}

/**
 * Ticks down from `durationSec` starting at `startedAt` (ms epoch).
 * Re-derives elapsed time from `startedAt` on every tick rather than
 * decrementing a counter, so it stays correct even if the tab throttles
 * background timers.
 */
export function useCountdown(durationSec: number, startedAt: number | null): UseCountdownResult {
  const [now, setNow] = useState(() => Date.now());
  const frame = useRef<number>();

  useEffect(() => {
    if (startedAt === null) return;

    const tick = () => {
      setNow(Date.now());
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);

    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [startedAt]);

  if (startedAt === null || durationSec <= 0) {
    return { remainingSec: durationSec, percentRemaining: 100, isExpired: false };
  }

  const elapsedSec = (now - startedAt) / 1000;
  const remainingSec = Math.max(0, durationSec - elapsedSec);
  const percentRemaining = Math.max(0, Math.min(100, (remainingSec / durationSec) * 100));

  return { remainingSec, percentRemaining, isExpired: remainingSec <= 0 };
}
