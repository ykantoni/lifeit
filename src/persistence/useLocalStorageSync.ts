import { useEffect, useRef } from 'react';
import { useBoardStore } from '../state/boardStore';
import { loadBoard, saveBoard } from './storage';

const SAVE_DEBOUNCE_MS = 500;

export function useLocalStorageSync(): void {
  const hydrate = useBoardStore((s) => s.hydrate);
  const items = useBoardStore((s) => s.items);
  const topLevelOrder = useBoardStore((s) => s.topLevelOrder);
  const hydrated = useRef(false);
  const saveTimeout = useRef<number | undefined>(undefined);

  useEffect(() => {
    const board = loadBoard();
    if (board) hydrate(board);
    hydrated.current = true;
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated.current) return;

    window.clearTimeout(saveTimeout.current);
    saveTimeout.current = window.setTimeout(() => {
      saveBoard({ version: 1, items, topLevelOrder });
    }, SAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(saveTimeout.current);
  }, [items, topLevelOrder]);

  useEffect(() => {
    const flush = () => {
      if (!hydrated.current) return;
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
