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

function toBoardState(raw: unknown): BoardState | null {
  if (!raw || typeof raw !== 'object') return null;
  const data = raw as Partial<PersistedBoard>;
  if (data.version !== STORAGE_VERSION) return null;
  if (!data.items || !Array.isArray(data.topLevelOrder)) return null;
  return {
    version: 1,
    items: data.items,
    topLevelOrder: data.topLevelOrder,
  };
}

/** Migrates arbitrary persisted JSON to the current BoardState shape. Unknown/corrupt input falls back to an empty board. */
export function migrate(raw: unknown): BoardState {
  return toBoardState(raw) ?? EMPTY_BOARD;
}

export function toPersisted(board: BoardState): PersistedBoard {
  return {
    version: 1,
    items: board.items,
    topLevelOrder: board.topLevelOrder,
    updatedAt: Date.now(),
  };
}

export interface ParsedPersisted {
  board: BoardState;
  updatedAt: number;
}

/** Parses raw JSON text into a board + its updatedAt timestamp. Returns null on any parse/shape failure (caller decides what that means). */
export function parsePersistedJson(json: string): ParsedPersisted | null {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return null;
  }
  const board = toBoardState(raw);
  if (!board) return null;
  const updatedAt = typeof (raw as Partial<PersistedBoard>).updatedAt === 'number' ? (raw as PersistedBoard).updatedAt : 0;
  return { board, updatedAt };
}
