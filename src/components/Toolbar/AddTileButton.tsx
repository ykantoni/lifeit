import { useBoardStore } from '../../state/boardStore';

export function AddTileButton() {
  const addTile = useBoardStore((s) => s.addTile);
  return (
    <button type="button" className="add-tile-button" onClick={() => addTile('')}>
      + Add tile
    </button>
  );
}
