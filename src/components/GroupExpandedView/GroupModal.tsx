import { useState } from 'react';
import type { Group } from '../../types/tile';
import { useBoardStore } from '../../state/boardStore';
import { Modal } from '../common/Modal';
import { GroupMemberList } from './GroupMemberList';
import { IconButton } from '../common/IconButton';

interface Props {
  group: Group;
  onClose: () => void;
}

export function GroupModal({ group, onClose }: Props) {
  const renameGroup = useBoardStore((s) => s.renameGroup);
  const deleteGroup = useBoardStore((s) => s.deleteGroup);
  const [name, setName] = useState(group.name);

  const commitName = () => {
    if (name !== group.name) renameGroup(group.id, name);
  };

  return (
    <Modal onClose={onClose}>
      <div className="group-modal-header">
        <input
          className="group-modal-name-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          }}
        />
        <IconButton label="Close" onClick={onClose}>
          ✕
        </IconButton>
      </div>
      <GroupMemberList group={group} />
      <div className="group-modal-footer">
        <button
          type="button"
          className="text-button"
          onClick={() => {
            deleteGroup(group.id, 'ungroup');
            onClose();
          }}
        >
          Ungroup (keep tiles)
        </button>
        <button
          type="button"
          className="text-button text-button--danger"
          onClick={() => {
            deleteGroup(group.id, 'delete-all');
            onClose();
          }}
        >
          Delete group & tiles
        </button>
      </div>
    </Modal>
  );
}
