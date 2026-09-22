import type { SizeTier } from '../types/tile';

export const SIZE_TIERS: SizeTier[] = ['small', 'medium', 'large', 'xlarge'];

const SPANS: Record<SizeTier, { col: number; row: number }> = {
  small: { col: 1, row: 1 },
  medium: { col: 2, row: 1 },
  large: { col: 2, row: 2 },
  xlarge: { col: 3, row: 2 },
};

export function tierSpan(tier: SizeTier): { col: number; row: number } {
  return SPANS[tier];
}

export function nextTier(tier: SizeTier): SizeTier {
  const i = SIZE_TIERS.indexOf(tier);
  return SIZE_TIERS[Math.min(i + 1, SIZE_TIERS.length - 1)];
}

export function prevTier(tier: SizeTier): SizeTier {
  const i = SIZE_TIERS.indexOf(tier);
  return SIZE_TIERS[Math.max(i - 1, 0)];
}
