import type { SizeTier } from '../types/tile';

export function computeDecay(referenceTime: number, now: number, halfLifeMs: number): number {
  const ageMs = Math.max(0, now - referenceTime);
  return Math.pow(0.5, ageMs / halfLifeMs);
}

export function computeScore(
  clickCount: number,
  lastClickedAt: number | null,
  createdAt: number,
  now: number,
  halfLifeMs: number,
): number {
  const effectiveClicks = clickCount + 1;
  const referenceTime = lastClickedAt ?? createdAt;
  return effectiveClicks * computeDecay(referenceTime, now, halfLifeMs);
}

// Each threshold is exactly half the one above it, matching the decay curve's own
// halving-per-half-life shape: an idle tile (fixed click count) drops exactly one
// tier every half-life, all the way down through all 8 tiers. A fresh, unclicked
// tile scores exactly 1 at the instant of creation, which lands it mid-ladder at
// "large" — giving it real headroom to grow with clicks and a real multi-tier decay
// runway before it bottoms out at "xs", instead of instantly landing at the bottom.
export function computeTier(score: number): SizeTier {
  if (score >= 16) return 'giant';
  if (score >= 8) return 'xxxlarge';
  if (score >= 4) return 'xxlarge';
  if (score >= 2) return 'xlarge';
  if (score >= 1) return 'large';
  if (score >= 0.5) return 'medium';
  if (score >= 0.25) return 'small';
  return 'xs';
}

export function computeAutoTier(
  clickCount: number,
  lastClickedAt: number | null,
  createdAt: number,
  now: number,
  halfLifeMs: number,
): SizeTier {
  return computeTier(computeScore(clickCount, lastClickedAt, createdAt, now, halfLifeMs));
}
