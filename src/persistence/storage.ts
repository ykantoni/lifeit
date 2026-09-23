import type { BoardState } from '../types/board';
import { parsePersistedJson, STORAGE_KEY, toPersisted, type ParsedPersisted } from './schema';

/** Reads localStorage keeping the updatedAt timestamp, needed to compare against a synced file's own updatedAt. */
export function loadPersistedBoard(): ParsedPersisted | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return parsePersistedJson(raw);
  } catch (err) {
    console.warn('Failed to load board from localStorage, starting fresh.', err);
    return null;
  }
}

export function loadBoard(): BoardState | null {
  return loadPersistedBoard()?.board ?? null;
}

export function saveBoard(board: BoardState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersisted(board)));
  } catch (err) {
    console.warn('Failed to save board to localStorage.', err);
  }
}
