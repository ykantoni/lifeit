import { useEffect, useState } from 'react';

/** Ticks `now` at the given interval so score-driven tiers get recomputed periodically. */
export function useScoreClock(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(interval);
  }, [intervalMs]);

  return now;
}
