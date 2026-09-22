import type { CSSProperties } from 'react';
import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import type { Tile as TileData } from '../../types/tile';
import { useBoardStore } from '../../state/boardStore';
import { useTileEffectiveTier } from '../../hooks/useTileEffectiveTier';
import { tierSpan } from '../../utils/sizeTiers';
import { ResizeHandle } from './ResizeHandle';
import { TileText } from './TileText';
import { IconButton } from '../common/IconButton';

interface Props {
  tile: TileData;
  setNodeRef: (node: HTMLElement | null) => void;
  style: CSSProperties;
  dragAttributes: DraggableAttributes;
  dragListeners: DraggableSyntheticListeners;
  isGroupTarget: boolean;
  isDragging: boolean;
}

export function Tile({ tile, setNodeRef, style, dragAttributes, dragListeners, isGroupTarget, isDragging }: Props) {
  const editText = useBoardStore((s) => s.editText);
  const clickItem = useBoardStore((s) => s.clickItem);
  const setManualTier = useBoardStore((s) => s.setManualTier);
  const clearManualTier = useBoardStore((s) => s.clearManualTier);
  const deleteTile = useBoardStore((s) => s.deleteTile);
  const tier = useTileEffectiveTier(tile);
  const span = tierSpan(tier);

  const classNames = [
    'tile',
    `tile--${tier}`,
    isGroupTarget && 'tile--group-target',
    isDragging && 'tile--dragging',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, gridColumn: `span ${span.col}`, gridRow: `span ${span.row}` }}
      className={classNames}
      {...dragAttributes}
      {...dragListeners}
    >
      <div className="tile-controls">
        {tile.manualTier && (
          <IconButton label="Auto-resize is off · click to re-enable" onClick={() => clearManualTier(tile.id)}>
            📌
          </IconButton>
        )}
        <IconButton label="Delete tile" onClick={() => deleteTile(tile.id)}>
          ✕
        </IconButton>
      </div>
      <TileText text={tile.text} onChange={(text) => editText(tile.id, text)} onActivate={() => clickItem(tile.id)} />
      <ResizeHandle currentTier={tier} onResize={(t) => setManualTier(tile.id, t)} />
    </div>
  );
}
