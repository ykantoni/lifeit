import { useEffect, useRef, useState } from 'react';
import { useBoardStore } from '../state/boardStore';
import { SAVE_DEBOUNCE_MS } from './constants';
import { loadBoard, saveBoard } from './storage';

export function useLocalStorageSync(): void {
  const hydrate = useBoardStore((s) => s.hydrate);
  const items = useBoardStore((s) => s.items);
  const topLevelOrder = useBoardStore((s) => s.topLevelOrder);
  // React state, not a ref: the debounced-save effect below must only see "hydrated"
  // become true on the same render where items/topLevelOrder already reflect the
  // hydrated board — otherwise it can schedule a save using the pre-hydration (empty)
  // closure and clobber real saved data before the hydrated render ever commits.
  const [hydrated, setHydrated] = useState(false);
  const hydratedRef = useRef(false);
  const saveTimeout = useRef<number | undefined>(undefined);

  useEffect(() => {
    const board = loadBoard();
    if (board) hydrate(board);
    setHydrated(true);
  }, [hydrate]);

  useEffect(() => {
    hydratedRef.current = hydrated;
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;

    window.clearTimeout(saveTimeout.current);
    saveTimeout.current = window.setTimeout(() => {
      saveBoard({ version: 1, items, topLevelOrder });
    }, SAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(saveTimeout.current);
  }, [items, topLevelOrder, hydrated]);

  useEffect(() => {
    const flush = () => {
      if (!hydratedRef.current) return;
      const { items: currentItems, topLevelOrder: currentOrder } = useBoardStore.getState();
      saveBoard({ version: 1, items: currentItems, topLevelOrder: currentOrder });
    };
    document.addEventListener('visibilitychange', flush);
    window.addEventListener('beforeunload', flush);
    return () => {
      document.removeEventListener('visibilitychange', flush);
      window.removeEventListener('beforeunload', flush);
    };
  }, []);
}
