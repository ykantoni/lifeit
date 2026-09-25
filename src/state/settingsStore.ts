import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** 1 minute — short enough that shrink-from-neglect is actually visible while testing/using the app. */
export const DEFAULT_HALF_LIFE_MS = 60 * 1000;
export const MIN_HALF_LIFE_MS = 1000;

interface SettingsState {
  halfLifeMs: number;
  setHalfLifeMs: (ms: number) => void;
  resetHalfLifeMs: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      halfLifeMs: DEFAULT_HALF_LIFE_MS,
      setHalfLifeMs: (ms) => set({ halfLifeMs: Math.max(MIN_HALF_LIFE_MS, Math.round(ms)) }),
      resetHalfLifeMs: () => set({ halfLifeMs: DEFAULT_HALF_LIFE_MS }),
    }),
    { name: 'lifeit.settings.v1' },
  ),
);
