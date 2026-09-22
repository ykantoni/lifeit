import type { BoardItem } from './tile';

export interface BoardState {
  version: 1;
  items: Record<string, BoardItem>;
  topLevelOrder: string[];
}
