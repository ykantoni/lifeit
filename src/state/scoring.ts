import type { SizeTier } from '../types/tile';

/** Half-life for the popularity decay curve. Tune this single constant to change how fast tiles shrink. */
export const HALF_LIFE_MS = 72 * 60 * 60 * 1000;

export function computeDecay(referenceTime: number, now: number): number {
  const ageMs = Math.max(0, now - referenceTime);
  return Math.pow(0.5, ageMs / HALF_LIFE_MS);
}

export function computeScore(
  clickCount: number,
  lastClickedAt: number | null,
  createdAt: number,
  now: number,
): number {
  const effectiveClicks = clickCount + 1;
  const referenceTime = lastClickedAt ?? createdAt;
  return effectiveClicks * computeDecay(referenceTime, now);
}

export function computeTier(score: number): SizeTier {
  if (score >= 6) return 'xlarge';
  if (score >= 2.5) return 'large';
  if (score >= 1) return 'medium';
  return 'small';
}

export function computeAutoTier(
  clickCount: number,
  lastClickedAt: number | null,
  createdAt: number,
  now: number,
): SizeTier {
  return computeTier(computeScore(clickCount, lastClickedAt, createdAt, now));
}
