import type { SizeTier } from '../types/tile';

export const SIZE_TIERS: SizeTier[] = [
  'xs',
  'small',
  'medium',
  'large',
  'xlarge',
  'xxlarge',
  'xxxlarge',
  'giant',
];

const SPANS: Record<SizeTier, { col: number; row: number }> = {
  xs: { col: 1, row: 1 },
  small: { col: 2, row: 1 },
  medium: { col: 2, row: 2 },
  large: { col: 3, row: 2 },
  xlarge: { col: 3, row: 3 },
  xxlarge: { col: 4, row: 3 },
  xxxlarge: { col: 4, row: 4 },
  giant: { col: 5, row: 4 },
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
