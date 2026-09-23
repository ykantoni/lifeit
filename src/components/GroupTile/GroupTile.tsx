import type { CSSProperties } from 'react';
import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import type { Group } from '../../types/tile';
import { useBoardStore } from '../../state/boardStore';
import { useTileEffectiveTier } from '../../hooks/useTileEffectiveTier';
import { tierSpan } from '../../utils/sizeTiers';
import { getGroupColors } from '../../utils/groupColor';
import { ResizeHandle } from '../Tile/ResizeHandle';
import { IconButton } from '../common/IconButton';

interface Props {
  group: Group;
  setNodeRef: (node: HTMLElement | null) => void;
  style: CSSProperties;
  dragAttributes: DraggableAttributes;
  dragListeners: DraggableSyntheticListeners;
  isGroupTarget: boolean;
  isDragging: boolean;
  onOpen: () => void;
}

export function GroupTile({
  group,
  setNodeRef,
  style,
  dragAttributes,
  dragListeners,
  isGroupTarget,
  isDragging,
  onOpen,
}: Props) {
  const clickItem = useBoardStore((s) => s.clickItem);
  const setManualTier = useBoardStore((s) => s.setManualTier);
  const clearManualTier = useBoardStore((s) => s.clearManualTier);
  const tier = useTileEffectiveTier(group);
  const span = tierSpan(tier);
  const colors = getGroupColors(group.id);

  const classNames = [
    'tile',
    'group-tile',
    `tile--${tier}`,
    isGroupTarget && 'tile--group-target',
    isDragging && 'tile--dragging',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={setNodeRef}
      style={
        {
          ...style,
          gridColumn: `span ${span.col}`,
          gridRow: `span ${span.row}`,
          background: colors.background,
          '--group-text': colors.text,
          '--group-text-muted': colors.textMuted,
        } as CSSProperties
      }
      className={classNames}
      {...dragAttributes}
      {...dragListeners}
      onClick={() => {
        clickItem(group.id);
        onOpen();
      }}
    >
      <div className="tile-controls">
        {group.manualTier && (
          <IconButton label="Auto-resize is off · click to re-enable" onClick={() => clearManualTier(group.id)}>
            📌
          </IconButton>
        )}
      </div>
      <div className="group-tile-body">
        <div className="group-tile-icon">🗂</div>
        <div className="group-tile-name">{group.name}</div>
        <div className="group-tile-count">{group.memberIds.length} tiles</div>
      </div>
      <ResizeHandle currentTier={tier} onResize={(t) => setManualTier(group.id, t)} />
    </div>
  );
}
