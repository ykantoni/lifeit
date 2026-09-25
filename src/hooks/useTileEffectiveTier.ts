import type { BoardItem, SizeTier } from '../types/tile';
import { computeAutoTier } from '../state/scoring';
import { useSettingsStore } from '../state/settingsStore';
import { useScoreClock } from './useScoreClock';

const MIN_TICK_MS = 1000;
const MAX_TICK_MS = 60_000;

export function useTileEffectiveTier(item: BoardItem): SizeTier {
  const halfLifeMs = useSettingsStore((s) => s.halfLifeMs);
  // Tick roughly 10x per half-life (clamped) so a short test half-life is actually
  // visible live, while a long, realistic one doesn't tick needlessly often.
  const tickMs = Math.min(MAX_TICK_MS, Math.max(MIN_TICK_MS, halfLifeMs / 10));
  const now = useScoreClock(tickMs);
  if (item.manualTier) return item.manualTier;
  return computeAutoTier(item.clickCount, item.lastClickedAt, item.createdAt, now, halfLifeMs);
}
