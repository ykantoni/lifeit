import { create } from 'zustand';
import type { BoardState } from '../types/board';
import type { BoardItem, Group, SizeTier, Tile } from '../types/tile';
import { createId } from '../utils/id';

function now(): number {
  return Date.now();
}

function isTile(item: BoardItem | undefined): item is Tile {
  return item?.kind === 'tile';
}

function isGroup(item: BoardItem | undefined): item is Group {
  return item?.kind === 'group';
}

function truncate(text: string, max = 24): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed || 'New group';
  return `${trimmed.slice(0, max)}…`;
}

function moveInArray<T>(arr: T[], from: number, to: number): T[] {
  const copy = arr.slice();
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

interface BoardStore extends BoardState {
  hydrate: (board: BoardState) => void;
  addTile: (text?: string) => void;
  editText: (id: string, text: string) => void;
  clickItem: (id: string) => void;
  setManualTier: (id: string, tier: SizeTier) => void;
  clearManualTier: (id: string) => void;
  reorderTopLevel: (activeId: string, overId: string) => void;
  groupTiles: (sourceId: string, targetId: string) => void;
  ungroupMember: (groupId: string, tileId: string) => void;
  renameGroup: (id: string, name: string) => void;
  deleteTile: (id: string) => void;
  deleteGroup: (id: string, mode: 'ungroup' | 'delete-all') => void;
  reorderWithinGroup: (groupId: string, activeId: string, overId: string) => void;
}

export const useBoardStore = create<BoardStore>((set, get) => ({
  version: 1,
  items: {},
  topLevelOrder: [],

  hydrate: (board) => set({ items: board.items, topLevelOrder: board.topLevelOrder }),

  addTile: (text = '') => {
    const id = createId();
    const tile: Tile = {
      id,
      kind: 'tile',
      text,
      createdAt: now(),
      manualTier: null,
      clickCount: 0,
      lastClickedAt: null,
      groupId: null,
    };
    set((state) => ({
      items: { ...state.items, [id]: tile },
      topLevelOrder: [id, ...state.topLevelOrder],
    }));
  },

  editText: (id, text) => {
    set((state) => {
      const item = state.items[id];
      if (!isTile(item)) return state;
      return { items: { ...state.items, [id]: { ...item, text } } };
    });
  },

  clickItem: (id) => {
    set((state) => {
      const item = state.items[id];
      if (!item) return state;
      const updated = { ...item, clickCount: item.clickCount + 1, lastClickedAt: now() };
      return { items: { ...state.items, [id]: updated } };
    });
  },

  setManualTier: (id, tier) => {
    set((state) => {
      const item = state.items[id];
      if (!item) return state;
      return { items: { ...state.items, [id]: { ...item, manualTier: tier } } };
    });
  },

  clearManualTier: (id) => {
    set((state) => {
      const item = state.items[id];
      if (!item) return state;
      return { items: { ...state.items, [id]: { ...item, manualTier: null } } };
    });
  },

  reorderTopLevel: (activeId, overId) => {
    if (activeId === overId) return;
    set((state) => {
      const from = state.topLevelOrder.indexOf(activeId);
      const to = state.topLevelOrder.indexOf(overId);
      if (from === -1 || to === -1) return state;
      return { topLevelOrder: moveInArray(state.topLevelOrder, from, to) };
    });
  },

  groupTiles: (sourceId, targetId) => {
    if (sourceId === targetId) return;
    set((state) => {
      const source = state.items[sourceId];
      const target = state.items[targetId];
      if (!isTile(source) || source.groupId) return state;
      if (!target) return state;

      if (isTile(target)) {
        const groupId = createId();
        const group: Group = {
          id: groupId,
          kind: 'group',
          name: truncate(target.text),
          createdAt: now(),
          manualTier: null,
          clickCount: 0,
          lastClickedAt: null,
          memberIds: [targetId, sourceId],
        };
        const targetIndex = state.topLevelOrder.indexOf(targetId);
        const nextOrder = state.topLevelOrder
          .filter((id) => id !== sourceId && id !== targetId);
        nextOrder.splice(targetIndex, 0, groupId);
        return {
          items: {
            ...state.items,
            [groupId]: group,
            [sourceId]: { ...source, groupId },
            [targetId]: { ...target, groupId },
          },
          topLevelOrder: nextOrder,
        };
      }

      if (isGroup(target)) {
        return {
          items: {
            ...state.items,
            [sourceId]: { ...source, groupId: targetId },
            [targetId]: { ...target, memberIds: [...target.memberIds, sourceId] },
          },
          topLevelOrder: state.topLevelOrder.filter((id) => id !== sourceId),
        };
      }

      return state;
    });
  },

  ungroupMember: (groupId, tileId) => {
    set((state) => {
      const group = state.items[groupId];
      const tile = state.items[tileId];
      if (!isGroup(group) || !isTile(tile)) return state;

      const remainingMembers = group.memberIds.filter((id) => id !== tileId);
      const groupIndex = state.topLevelOrder.indexOf(groupId);

      if (remainingMembers.length <= 1) {
        const items = { ...state.items };
        items[tileId] = { ...tile, groupId: null };
        const topLevelOrder = state.topLevelOrder.slice();
        if (remainingMembers.length === 1) {
          const lastId = remainingMembers[0];
          const last = items[lastId];
          if (isTile(last)) items[lastId] = { ...last, groupId: null };
          topLevelOrder.splice(groupIndex, 1, lastId, tileId);
        } else {
          topLevelOrder.splice(groupIndex, 1, tileId);
        }
        delete items[groupId];
        return { items, topLevelOrder };
      }

      const topLevelOrder = state.topLevelOrder.slice();
      topLevelOrder.splice(groupIndex + 1, 0, tileId);
      return {
        items: {
          ...state.items,
          [groupId]: { ...group, memberIds: remainingMembers },
          [tileId]: { ...tile, groupId: null },
        },
        topLevelOrder,
      };
    });
  },

  renameGroup: (id, name) => {
    set((state) => {
      const group = state.items[id];
      if (!isGroup(group)) return state;
      const trimmed = name.trim();
      return { items: { ...state.items, [id]: { ...group, name: trimmed || 'Untitled Group' } } };
    });
  },

  deleteTile: (id) => {
    const state = get();
    const tile = state.items[id];
    if (!isTile(tile)) return;

    if (tile.groupId) {
      get().ungroupMember(tile.groupId, id);
      set((s) => {
        const items = { ...s.items };
        delete items[id];
        return { items, topLevelOrder: s.topLevelOrder.filter((i) => i !== id) };
      });
      return;
    }

    set((s) => {
      const items = { ...s.items };
      delete items[id];
      return { items, topLevelOrder: s.topLevelOrder.filter((i) => i !== id) };
    });
  },

  deleteGroup: (id, mode) => {
    set((state) => {
      const group = state.items[id];
      if (!isGroup(group)) return state;
      const items = { ...state.items };
      const groupIndex = state.topLevelOrder.indexOf(id);
      const topLevelOrder = state.topLevelOrder.slice();

      if (mode === 'delete-all') {
        for (const memberId of group.memberIds) delete items[memberId];
        delete items[id];
        topLevelOrder.splice(groupIndex, 1);
        return { items, topLevelOrder };
      }

      for (const memberId of group.memberIds) {
        const member = items[memberId];
        if (isTile(member)) items[memberId] = { ...member, groupId: null };
      }
      delete items[id];
      topLevelOrder.splice(groupIndex, 1, ...group.memberIds);
      return { items, topLevelOrder };
    });
  },

  reorderWithinGroup: (groupId, activeId, overId) => {
    if (activeId === overId) return;
    set((state) => {
      const group = state.items[groupId];
      if (!isGroup(group)) return state;
      const from = group.memberIds.indexOf(activeId);
      const to = group.memberIds.indexOf(overId);
      if (from === -1 || to === -1) return state;
      return {
        items: { ...state.items, [groupId]: { ...group, memberIds: moveInArray(group.memberIds, from, to) } },
      };
    });
  },
}));
