import { useEffect, useRef, useState } from 'react';
import { useBoardStore } from '../state/boardStore';
import { SAVE_DEBOUNCE_MS } from '../persistence/constants';
import { clearStoredHandle, getStoredHandle, setStoredHandle } from '../persistence/handleStore';
import {
  isFileSystemAccessSupported,
  pickNewFileHandle,
  queryHandlePermission,
  readBoardFromHandle,
  requestHandlePermission,
  writeBoardToHandle,
} from '../persistence/fileSync';
import { loadPersistedBoard } from '../persistence/storage';
import { downloadBoardAsFile, readBoardFromUploadedFile } from '../persistence/manualFileIO';
import type { ParsedPersisted } from '../persistence/schema';

export type FileSyncStatus = 'unsupported' | 'disconnected' | 'connecting' | 'connected' | 'reconnect-needed' | 'error';

interface Conflict {
  handle: FileSystemFileHandle;
  parsed: ParsedPersisted;
}

export interface FileSyncApi {
  status: FileSyncStatus;
  fileName: string | null;
  errorMessage: string | null;
  pendingConflict: boolean;
  connectFile: () => void;
  disconnectFile: () => void;
  reconnect: () => void;
  resolveConflict: (choice: 'load' | 'overwrite') => void;
  cancelConflict: () => void;
  downloadBoard: () => void;
  loadFromFile: (file: File) => void;
}

export function useFileSync(): FileSyncApi {
  const hydrate = useBoardStore((s) => s.hydrate);
  const items = useBoardStore((s) => s.items);
  const topLevelOrder = useBoardStore((s) => s.topLevelOrder);

  const supported = isFileSystemAccessSupported();
  const [status, setStatus] = useState<FileSyncStatus>(supported ? 'disconnected' : 'unsupported');
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [conflict, setConflict] = useState<Conflict | null>(null);

  const handleRef = useRef<FileSystemFileHandle | null>(null);
  const fileHydratedRef = useRef(false);
  const statusBeforeConnectRef = useRef<FileSyncStatus>('disconnected');
  const saveTimeout = useRef<number | undefined>(undefined);

  /** Reads the file, resolves empty/invalid content by writing the current board, or defers to whichever of {file, localStorage} is newer. */
  const mergeAndConnect = async (handle: FileSystemFileHandle) => {
    try {
      const result = await readBoardFromHandle(handle);
      if (result.kind === 'valid') {
        const localUpdatedAt = loadPersistedBoard()?.updatedAt ?? 0;
        if (result.parsed.updatedAt > localUpdatedAt) {
          hydrate(result.parsed.board);
        } else {
          await writeBoardToHandle(handle, useBoardStore.getState());
        }
      } else {
        if (result.kind === 'invalid') {
          console.warn('Connected file contains unreadable board data; overwriting it with the current board.');
        }
        await writeBoardToHandle(handle, useBoardStore.getState());
      }
      await setStoredHandle(handle);
      handleRef.current = handle;
      fileHydratedRef.current = true;
      setFileName(handle.name);
      setErrorMessage(null);
      setStatus('connected');
    } catch (err) {
      console.warn('Failed to sync with the connected file.', err);
      setErrorMessage('Could not read or write the connected file.');
      setStatus('error');
    }
  };

  const handleWriteError = (err: unknown) => {
    if (err instanceof DOMException && err.name === 'NotAllowedError') {
      setStatus('reconnect-needed');
      return;
    }
    if (err instanceof DOMException && err.name === 'NotFoundError') {
      void clearStoredHandle();
      handleRef.current = null;
      fileHydratedRef.current = false;
      setFileName(null);
      setStatus('disconnected');
      return;
    }
    console.warn('Failed to save board to file.', err);
    setErrorMessage('Could not save to the connected file.');
    setStatus('error');
  };

  // Mount recovery: reuse a remembered handle if we still have write permission,
  // otherwise surface a reconnect affordance rather than guessing.
  useEffect(() => {
    if (!supported) return;
    let cancelled = false;

    (async () => {
      const handle = await getStoredHandle();
      if (cancelled) return;
      if (!handle) {
        setStatus('disconnected');
        return;
      }
      setFileName(handle.name);
      const permission = await queryHandlePermission(handle);
      if (cancelled) return;
      if (permission === 'denied') {
        await clearStoredHandle();
        setFileName(null);
        setStatus('disconnected');
        return;
      }
      if (permission === 'prompt') {
        handleRef.current = handle;
        setStatus('reconnect-needed');
        return;
      }
      handleRef.current = handle;
      await mergeAndConnect(handle);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced write-through to the connected file, independent of localStorage's own save timer.
  useEffect(() => {
    if (status !== 'connected' || !fileHydratedRef.current || !handleRef.current) return;
    const handle = handleRef.current;

    window.clearTimeout(saveTimeout.current);
    saveTimeout.current = window.setTimeout(() => {
      writeBoardToHandle(handle, useBoardStore.getState())
        .then(() => setErrorMessage(null))
        .catch(handleWriteError);
    }, SAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(saveTimeout.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, topLevelOrder, status]);

  useEffect(() => {
    const flush = () => {
      if (status !== 'connected' || !fileHydratedRef.current || !handleRef.current) return;
      void writeBoardToHandle(handleRef.current, useBoardStore.getState());
    };
    document.addEventListener('visibilitychange', flush);
    window.addEventListener('beforeunload', flush);
    return () => {
      document.removeEventListener('visibilitychange', flush);
      window.removeEventListener('beforeunload', flush);
    };
  }, [status]);

  const connectFile = () => {
    statusBeforeConnectRef.current = status;
    setStatus('connecting');
    (async () => {
      let handle: FileSystemFileHandle | null;
      try {
        handle = await pickNewFileHandle();
      } catch (err) {
        console.warn('Failed to open the file picker.', err);
        setErrorMessage('Could not open the file picker.');
        setStatus('error');
        return;
      }
      if (!handle) {
        setStatus(statusBeforeConnectRef.current);
        return;
      }
      let result;
      try {
        result = await readBoardFromHandle(handle);
      } catch (err) {
        console.warn('Failed to read the selected file.', err);
        setErrorMessage('Could not read the selected file.');
        setStatus('error');
        return;
      }
      if (result.kind === 'valid') {
        setFileName(handle.name);
        setConflict({ handle, parsed: result.parsed });
        return;
      }
      await mergeAndConnect(handle);
    })();
  };

  const resolveConflict = (choice: 'load' | 'overwrite') => {
    if (!conflict) return;
    const { handle, parsed } = conflict;
    setConflict(null);
    (async () => {
      try {
        if (choice === 'load') {
          hydrate(parsed.board);
        } else {
          await writeBoardToHandle(handle, useBoardStore.getState());
        }
        await setStoredHandle(handle);
        handleRef.current = handle;
        fileHydratedRef.current = true;
        setFileName(handle.name);
        setErrorMessage(null);
        setStatus('connected');
      } catch (err) {
        console.warn('Failed to finish connecting the file.', err);
        setErrorMessage('Could not finish connecting the file.');
        setStatus('error');
      }
    })();
  };

  const cancelConflict = () => {
    setConflict(null);
    setFileName(handleRef.current?.name ?? null);
    setStatus(statusBeforeConnectRef.current);
  };

  const disconnectFile = () => {
    void clearStoredHandle();
    handleRef.current = null;
    fileHydratedRef.current = false;
    setFileName(null);
    setErrorMessage(null);
    setStatus('disconnected');
  };

  const reconnect = () => {
    const handle = handleRef.current;
    if (!handle) return;
    setStatus('connecting');
    (async () => {
      let permission: PermissionState;
      try {
        permission = await requestHandlePermission(handle);
      } catch (err) {
        console.warn('Failed to request file permission.', err);
        setErrorMessage('Could not request permission for the file.');
        setStatus('error');
        return;
      }
      if (permission !== 'granted') {
        await clearStoredHandle();
        handleRef.current = null;
        setFileName(null);
        setStatus('disconnected');
        return;
      }
      await mergeAndConnect(handle);
    })();
  };

  const downloadBoard = () => {
    downloadBoardAsFile(useBoardStore.getState());
  };

  const loadFromFile = (file: File) => {
    (async () => {
      const parsed = await readBoardFromUploadedFile(file);
      if (parsed) hydrate(parsed.board);
    })();
  };

  return {
    status,
    fileName,
    errorMessage,
    pendingConflict: conflict !== null,
    connectFile,
    disconnectFile,
    reconnect,
    resolveConflict,
    cancelConflict,
    downloadBoard,
    loadFromFile,
  };
}
