import type { BoardItem, SizeTier } from '../types/tile';
import { computeAutoTier } from '../state/scoring';
import { useScoreClock } from './useScoreClock';

export function useTileEffectiveTier(item: BoardItem): SizeTier {
  const now = useScoreClock();
  if (item.manualTier) return item.manualTier;
  return computeAutoTier(item.clickCount, item.lastClickedAt, item.createdAt, now);
}
