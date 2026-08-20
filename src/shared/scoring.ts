import { ScoreCalculationParams } from './types';

/**
 * Calculates score based on answer speed and input mode.
 * Standard decaying curve with 1.5x bonus for direct input (no options).
 */
export function calculateScore({
  basePoints,
  timeLimitSec,
  remainingTimeSec,
  isCorrect,
  inputMode
}: ScoreCalculationParams): number {
  if (!isCorrect) return 0;

  const MIN_FRACTION = 0.3;
  const DECAY_EXPONENT = 1.3;
  const DIRECT_INPUT_MULTIPLIER = 1.5;

  const clampedRemaining = Math.max(0, Math.min(remainingTimeSec, timeLimitSec));
  const timeFraction = clampedRemaining / timeLimitSec;

  const decayFactor = MIN_FRACTION + (1 - MIN_FRACTION) * Math.pow(timeFraction, DECAY_EXPONENT);
  let score = Math.round(basePoints * decayFactor);

  if (inputMode === 'direct_input') {
    score = Math.round(score * DIRECT_INPUT_MULTIPLIER);
  }

  return score;
}