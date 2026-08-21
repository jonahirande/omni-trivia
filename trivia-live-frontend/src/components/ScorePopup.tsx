interface ScorePopupProps {
  points: number;
  visible: boolean;
  /** unique key changes each time to re-trigger the animation */
  animKey: number;
}

export function ScorePopup({ points, visible, animKey }: ScorePopupProps) {
  if (!visible) return null;

  const isZero = points <= 0;

  return (
    <div
      key={animKey}
      className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-2 z-30 animate-popUp"
    >
      <span
        className={`font-display font-extrabold text-2xl drop-shadow-lg ${
          isZero ? 'text-arcade-coral' : 'text-arcade-gold'
        }`}
      >
        {isZero ? 'No points' : `+${points}`}
      </span>
    </div>
  );
}
