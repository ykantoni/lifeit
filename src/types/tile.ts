export type SizeTier = 'small' | 'medium' | 'large' | 'xlarge';

interface BaseItem {
  id: string;
  createdAt: number;
  manualTier: SizeTier | null;
}

export interface Tile extends BaseItem {
  kind: 'tile';
  text: string;
  clickCount: number;
  lastClickedAt: number | null;
  groupId: string | null;
}

export interface Group extends BaseItem {
  kind: 'group';
  name: string;
  memberIds: string[];
  clickCount: number;
  lastClickedAt: number | null;
}

export type BoardItem = Tile | Group;
