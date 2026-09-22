import { useState, type CSSProperties } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { useBoardStore } from '../../state/boardStore';
import { Tile } from '../Tile/Tile';
import { GroupTile } from '../GroupTile/GroupTile';
import { GroupModal } from '../GroupExpandedView/GroupModal';
import { AddTileButton } from '../Toolbar/AddTileButton';

interface SimpleRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Inner 40% of the target = group intent, outer 60% (edges) = reorder intent. */
function resolveDropIntent(activeRect: SimpleRect, overRect: SimpleRect): 'group' | 'reorder' {
  const cx = activeRect.left + activeRect.width / 2;
  const cy = activeRect.top + activeRect.height / 2;
  const innerLeft = overRect.left + overRect.width * 0.3;
  const innerRight = overRect.left + overRect.width * 0.7;
  const innerTop = overRect.top + overRect.height * 0.3;
  const innerBottom = overRect.top + overRect.height * 0.7;
  const inside = cx >= innerLeft && cx <= innerRight && cy >= innerTop && cy <= innerBottom;
  return inside ? 'group' : 'reorder';
}

interface SlotProps {
  id: string;
  isGroupTarget: boolean;
  onOpenGroup: (id: string) => void;
}

function BoardItemSlot({ id, isGroupTarget, onOpenGroup }: SlotProps) {
  const item = useBoardStore((s) => s.items[id]);
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({ id });
  const { setNodeRef: setDropRef } = useDroppable({ id });

  const setNodeRef = (node: HTMLElement | null) => {
    setDragRef(node);
    setDropRef(node);
  };

  if (!item) return null;

  // Items only move on drop (see Board's onDragEnd) — no live reflow of siblings while
  // dragging, so the tile you're aiming to drop onto never shifts out from under the cursor.
  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 10 : undefined,
  };

  if (item.kind === 'group') {
    return (
      <GroupTile
        group={item}
        setNodeRef={setNodeRef}
        style={style}
        dragAttributes={attributes}
        dragListeners={listeners}
        isGroupTarget={isGroupTarget}
        isDragging={isDragging}
        onOpen={() => onOpenGroup(id)}
      />
    );
  }

  return (
    <Tile
      tile={item}
      setNodeRef={setNodeRef}
      style={style}
      dragAttributes={attributes}
      dragListeners={listeners}
      isGroupTarget={isGroupTarget}
      isDragging={isDragging}
    />
  );
}

export function Board() {
  const items = useBoardStore((s) => s.items);
  const topLevelOrder = useBoardStore((s) => s.topLevelOrder);
  const groupTiles = useBoardStore((s) => s.groupTiles);
  const reorderTopLevel = useBoardStore((s) => s.reorderTopLevel);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [intent, setIntent] = useState<'group' | 'reorder' | null>(null);
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  const [gridRef] = useAutoAnimate<HTMLDivElement>();

  const openGroup = useBoardStore((s) => (openGroupId ? s.items[openGroupId] : null));

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  /** Resolves group-vs-reorder intent fresh from live event rects (not stale state). */
  const resolveIntentFromEvent = (event: DragMoveEvent | DragEndEvent): 'group' | 'reorder' | null => {
    const { active, over } = event;
    if (!over || active.id === over.id) return null;
    const activeItem = items[String(active.id)];
    const translated = active.rect.current.translated;
    if (!translated || activeItem?.kind !== 'tile') return 'reorder';
    return resolveDropIntent(translated, over.rect);
  };

  const handleDragMove = (event: DragMoveEvent) => {
    const { over } = event;
    if (!over) {
      setOverId(null);
      setIntent(null);
      return;
    }
    setOverId(String(over.id));
    setIntent(resolveIntentFromEvent(event));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const finalIntent = resolveIntentFromEvent(event);
    setActiveId(null);
    setOverId(null);
    setIntent(null);
    if (!over || active.id === over.id) return;
    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);
    if (finalIntent === 'group') {
      groupTiles(activeIdStr, overIdStr);
    } else {
      reorderTopLevel(activeIdStr, overIdStr);
    }
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      >
        <div className="board" ref={gridRef}>
          {topLevelOrder.map((id) => (
            <BoardItemSlot
              key={id}
              id={id}
              isGroupTarget={overId === id && intent === 'group' && activeId !== id}
              onOpenGroup={setOpenGroupId}
            />
          ))}
        </div>
      </DndContext>
      {topLevelOrder.length === 0 && (
        <div className="board-empty-state">
          <p>Your board is empty.</p>
          <AddTileButton />
        </div>
      )}
      {openGroup && openGroup.kind === 'group' && (
        <GroupModal group={openGroup} onClose={() => setOpenGroupId(null)} />
      )}
    </>
  );
}
