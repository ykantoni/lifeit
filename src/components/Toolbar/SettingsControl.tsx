import { useState } from 'react';
import { DEFAULT_HALF_LIFE_MS, useSettingsStore } from '../../state/settingsStore';
import { Modal } from '../common/Modal';
import { IconButton } from '../common/IconButton';

type Unit = 'seconds' | 'minutes' | 'hours' | 'days';

const UNIT_MS: Record<Unit, number> = {
  seconds: 1000,
  minutes: 60 * 1000,
  hours: 60 * 60 * 1000,
  days: 24 * 60 * 60 * 1000,
};

const UNITS_LARGEST_FIRST: Unit[] = ['days', 'hours', 'minutes', 'seconds'];

function msToAmountUnit(ms: number): { amount: number; unit: Unit } {
  for (const unit of UNITS_LARGEST_FIRST) {
    const unitMs = UNIT_MS[unit];
    if (ms >= unitMs && ms % unitMs === 0) {
      return { amount: ms / unitMs, unit };
    }
  }
  return { amount: Math.max(1, Math.round(ms / 1000)), unit: 'seconds' };
}

function formatHalfLife(ms: number): string {
  const { amount, unit } = msToAmountUnit(ms);
  const label = amount === 1 ? unit.slice(0, -1) : unit;
  return `${amount} ${label}`;
}

export function SettingsControl() {
  const halfLifeMs = useSettingsStore((s) => s.halfLifeMs);
  const setHalfLifeMs = useSettingsStore((s) => s.setHalfLifeMs);
  const resetHalfLifeMs = useSettingsStore((s) => s.resetHalfLifeMs);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(1);
  const [unit, setUnit] = useState<Unit>('minutes');

  const openModal = () => {
    const current = msToAmountUnit(halfLifeMs);
    setAmount(current.amount);
    setUnit(current.unit);
    setOpen(true);
  };

  const save = () => {
    if (amount > 0) setHalfLifeMs(amount * UNIT_MS[unit]);
    setOpen(false);
  };

  return (
    <>
      <button type="button" className="text-button" onClick={openModal} title="How fast idle tiles shrink">
        ⏱ Shrink: {formatHalfLife(halfLifeMs)}
      </button>
      {open && (
        <Modal onClose={() => setOpen(false)}>
          <div className="group-modal-header">
            <h2 className="modal-title">Shrink speed</h2>
            <IconButton label="Close" onClick={() => setOpen(false)}>
              ✕
            </IconButton>
          </div>
          <p>
            An idle tile (no clicks) drops one size every half-life below. Clicking a tile always grows it
            immediately, regardless of this setting.
          </p>
          <div className="settings-row">
            <input
              type="number"
              min={1}
              className="settings-amount-input"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
            <select
              className="settings-unit-select"
              value={unit}
              onChange={(e) => setUnit(e.target.value as Unit)}
            >
              <option value="seconds">seconds</option>
              <option value="minutes">minutes</option>
              <option value="hours">hours</option>
              <option value="days">days</option>
            </select>
          </div>
          <div className="group-modal-footer">
            <button
              type="button"
              className="text-button"
              onClick={() => {
                resetHalfLifeMs();
                setOpen(false);
              }}
            >
              Reset to default ({formatHalfLife(DEFAULT_HALF_LIFE_MS)})
            </button>
            <button type="button" className="add-tile-button" onClick={save}>
              Save
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
