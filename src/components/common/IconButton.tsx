import type { ReactNode } from 'react';

interface Props {
  label: string;
  onClick: () => void;
  children: ReactNode;
}

export function IconButton({ label, onClick, children }: Props) {
  return (
    <button
      type="button"
      className="icon-button"
      aria-label={label}
      title={label}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {children}
    </button>
  );
}
