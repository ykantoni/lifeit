import type { BoardState } from '../types/board';

export const STORAGE_KEY = 'lifeit.board.v1';
export const STORAGE_VERSION = 1 as const;

export interface PersistedBoard {
  version: 1;
  items: BoardState['items'];
  topLevelOrder: string[];
  updatedAt: number;
}

const EMPTY_BOARD: BoardState = {
  version: 1,
  items: {},
  topLevelOrder: [],
};

/** Migrates arbitrary persisted JSON to the current BoardState shape. Unknown/corrupt input falls back to an empty board. */
export function migrate(raw: unknown): BoardState {
  if (!raw || typeof raw !== 'object') return EMPTY_BOARD;
  const data = raw as Partial<PersistedBoard>;
  if (data.version !== STORAGE_VERSION) return EMPTY_BOARD;
  if (!data.items || !Array.isArray(data.topLevelOrder)) return EMPTY_BOARD;
  return {
    version: 1,
    items: data.items,
    topLevelOrder: data.topLevelOrder,
  };
}

export function toPersisted(board: BoardState): PersistedBoard {
  return {
    version: 1,
    items: board.items,
    topLevelOrder: board.topLevelOrder,
    updatedAt: Date.now(),
  };
}
