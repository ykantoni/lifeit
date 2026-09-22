import type { BoardState } from '../types/board';
import { migrate, STORAGE_KEY, toPersisted } from './schema';

export function loadBoard(): BoardState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return migrate(JSON.parse(raw));
  } catch (err) {
    console.warn('Failed to load board from localStorage, starting fresh.', err);
    return null;
  }
}

export function saveBoard(board: BoardState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersisted(board)));
  } catch (err) {
    console.warn('Failed to save board to localStorage.', err);
  }
}
