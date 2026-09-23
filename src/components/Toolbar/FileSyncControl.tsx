import type { ChangeEvent } from 'react';
import type { FileSyncApi } from '../../hooks/useFileSync';
import { Modal } from '../common/Modal';
import { IconButton } from '../common/IconButton';

interface Props {
  api: FileSyncApi;
}

export function FileSyncControl({ api }: Props) {
  const {
    status,
    fileName,
    pendingConflict,
    connectFile,
    disconnectFile,
    reconnect,
    resolveConflict,
    cancelConflict,
    downloadBoard,
    loadFromFile,
  } = api;

  const handleUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFromFile(file);
    e.target.value = '';
  };

  return (
    <div className="file-sync">
      {status === 'unsupported' && (
        <>
          <button type="button" className="text-button" onClick={downloadBoard}>
            Download board.json
          </button>
          <label className="text-button file-sync-upload-label">
            Load from file…
            <input type="file" accept="application/json" onChange={handleUpload} hidden />
          </label>
        </>
      )}

      {status === 'disconnected' && (
        <button type="button" className="text-button" onClick={connectFile}>
          Connect file…
        </button>
      )}

      {status === 'connecting' && (
        <button type="button" className="text-button" disabled>
          Connecting…
        </button>
      )}

      {status === 'connected' && (
        <>
          <span className="file-sync-status">Synced to {fileName}</span>
          <button type="button" className="text-button" onClick={disconnectFile}>
            Disconnect
          </button>
        </>
      )}

      {status === 'reconnect-needed' && (
        <>
          <span className="file-sync-status">{fileName}</span>
          <button type="button" className="text-button file-sync-reconnect" onClick={reconnect}>
            Reconnect
          </button>
        </>
      )}

      {status === 'error' && (
        <>
          <span className="file-sync-status file-sync-status--error">Couldn't save to {fileName}</span>
          <button type="button" className="text-button" onClick={reconnect}>
            Retry
          </button>
        </>
      )}

      {pendingConflict && (
        <Modal onClose={cancelConflict}>
          <div className="group-modal-header">
            <h2 className="file-sync-conflict-title">{fileName} already has data</h2>
            <IconButton label="Close" onClick={cancelConflict}>
              ✕
            </IconButton>
          </div>
          <p>This file already contains a saved board. Load it into Tile Board, or overwrite it with what's currently on screen?</p>
          <div className="group-modal-footer">
            <button type="button" className="text-button" onClick={() => resolveConflict('load')}>
              Load file
            </button>
            <button type="button" className="text-button text-button--danger" onClick={() => resolveConflict('overwrite')}>
              Overwrite file
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
