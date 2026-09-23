import type { BoardState } from '../types/board';
import { parsePersistedJson, toPersisted, type ParsedPersisted } from './schema';

export function downloadBoardAsFile(board: BoardState): void {
  const blob = new Blob([JSON.stringify(toPersisted(board), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'board.json';
  link.click();
  URL.revokeObjectURL(url);
}

export async function readBoardFromUploadedFile(file: File): Promise<ParsedPersisted | null> {
  const text = await file.text();
  return parsePersistedJson(text);
}
