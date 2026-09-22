import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Group, Tile as TileData } from '../../types/tile';
import { useBoardStore } from '../../state/boardStore';

interface RowProps {
  tile: TileData;
  groupId: string;
}

function MemberRow({ tile, groupId }: RowProps) {
  const editText = useBoardStore((s) => s.editText);
  const ungroupMember = useBoardStore((s) => s.ungroupMember);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tile.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="group-member-row"
      {...attributes}
      {...listeners}
    >
      <input
        className="group-member-text-input"
        value={tile.text}
        onChange={(e) => editText(tile.id, e.target.value)}
        onPointerDown={(e) => e.stopPropagation()}
        placeholder="Click to add text…"
      />
      <button
        type="button"
        className="icon-button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          ungroupMember(groupId, tile.id);
        }}
        aria-label="Remove from group"
        title="Remove from group"
      >
        ⏏
      </button>
    </div>
  );
}

interface Props {
  group: Group;
}

export function GroupMemberList({ group }: Props) {
  const items = useBoardStore((s) => s.items);
  const reorderWithinGroup = useBoardStore((s) => s.reorderWithinGroup);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    reorderWithinGroup(group.id, String(active.id), String(over.id));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={group.memberIds} strategy={verticalListSortingStrategy}>
        <div className="group-member-list">
          {group.memberIds.map((id) => {
            const tile = items[id];
            if (!tile || tile.kind !== 'tile') return null;
            return <MemberRow key={id} tile={tile} groupId={group.id} />;
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}
