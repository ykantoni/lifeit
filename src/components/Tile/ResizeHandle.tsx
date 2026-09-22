import { useRef } from 'react';
import type { SizeTier } from '../../types/tile';
import { nextTier, prevTier } from '../../utils/sizeTiers';

interface Props {
  currentTier: SizeTier;
  onResize: (tier: SizeTier) => void;
}

const STEP_PX = 60;

interface DragState {
  startX: number;
  startY: number;
  tier: SizeTier;
  steps: number;
}

export function ResizeHandle({ currentTier, onResize }: Props) {
  const dragState = useRef<DragState | null>(null);

  const handlePointerMove = (e: PointerEvent) => {
    const state = dragState.current;
    if (!state) return;
    const delta = e.clientX - state.startX + (e.clientY - state.startY);
    const targetSteps = Math.trunc(delta / STEP_PX);
    while (state.steps < targetSteps) {
      state.tier = nextTier(state.tier);
      state.steps += 1;
      onResize(state.tier);
    }
    while (state.steps > targetSteps) {
      state.tier = prevTier(state.tier);
      state.steps -= 1;
      onResize(state.tier);
    }
  };

  const handlePointerUp = () => {
    dragState.current = null;
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    dragState.current = { startX: e.clientX, startY: e.clientY, tier: currentTier, steps: 0 };
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  return (
    <button
      type="button"
      className="resize-handle"
      onPointerDown={handlePointerDown}
      onClick={(e) => e.stopPropagation()}
      aria-label="Resize tile, drag to grow or shrink"
      title="Drag to resize"
    >
      ⤡
    </button>
  );
}
