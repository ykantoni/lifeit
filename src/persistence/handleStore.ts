import { del, get, set } from 'idb-keyval';

const HANDLE_KEY = 'lifeit.fileHandle.v1';

export async function getStoredHandle(): Promise<FileSystemFileHandle | null> {
  try {
    const handle = await get<FileSystemFileHandle>(HANDLE_KEY);
    return handle ?? null;
  } catch (err) {
    console.warn('Failed to read stored file handle.', err);
    return null;
  }
}

export async function setStoredHandle(handle: FileSystemFileHandle): Promise<void> {
  try {
    await set(HANDLE_KEY, handle);
  } catch (err) {
    console.warn('Failed to persist file handle.', err);
  }
}

export async function clearStoredHandle(): Promise<void> {
  try {
    await del(HANDLE_KEY);
  } catch (err) {
    console.warn('Failed to clear stored file handle.', err);
  }
}
