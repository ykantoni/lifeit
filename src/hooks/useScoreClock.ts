import { useEffect, useState } from 'react';

const TICK_MS = 60_000;

/** Shared clock tick so score-driven tiers can be recomputed periodically without per-tile timers. */
export function useScoreClock(): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(interval);
  }, []);

  return now;
}
