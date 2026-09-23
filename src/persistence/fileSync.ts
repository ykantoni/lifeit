import type { BoardState } from '../types/board';
import { parsePersistedJson, toPersisted, type ParsedPersisted } from './schema';

export function isFileSystemAccessSupported(): boolean {
  return 'showSaveFilePicker' in window;
}

/** Opens the native save-file dialog. Returns null if the user cancels (AbortError); other errors rethrow. */
export async function pickNewFileHandle(): Promise<FileSystemFileHandle | null> {
  try {
    return await window.showSaveFilePicker({
      suggestedName: 'board.json',
      types: [{ description: 'Tile Board file', accept: { 'application/json': ['.json'] } }],
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') return null;
    throw err;
  }
}

export function queryHandlePermission(handle: FileSystemFileHandle): Promise<PermissionState> {
  return handle.queryPermission({ mode: 'readwrite' });
}

/** Must be called synchronously from a user-gesture event handler (e.g. a button's onClick). */
export function requestHandlePermission(handle: FileSystemFileHandle): Promise<PermissionState> {
  return handle.requestPermission({ mode: 'readwrite' });
}

export type FileReadResult =
  | { kind: 'empty' }
  | { kind: 'invalid' }
  | { kind: 'valid'; parsed: ParsedPersisted };

export async function readBoardFromHandle(handle: FileSystemFileHandle): Promise<FileReadResult> {
  const file = await handle.getFile();
  const text = await file.text();
  if (!text.trim()) return { kind: 'empty' };
  const parsed = parsePersistedJson(text);
  if (!parsed) return { kind: 'invalid' };
  return { kind: 'valid', parsed };
}

export async function writeBoardToHandle(handle: FileSystemFileHandle, board: BoardState): Promise<void> {
  const writable = await handle.createWritable();
  await writable.write(JSON.stringify(toPersisted(board), null, 2));
  await writable.close();
}
