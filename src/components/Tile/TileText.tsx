import { useEffect, useRef, useState } from 'react';

interface Props {
  text: string;
  onChange: (text: string) => void;
  onActivate: () => void;
}

export function TileText({ text, onChange, onActivate }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft !== text) onChange(draft);
  };

  if (editing) {
    return (
      <textarea
        ref={textareaRef}
        className="tile-text tile-text--editing"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onActivate();
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setDraft(text);
            setEditing(false);
          }
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            commit();
          }
        }}
      />
    );
  }

  return (
    <div
      className="tile-text"
      onClick={() => {
        onActivate();
        setDraft(text);
        setEditing(true);
      }}
    >
      {text ? text : <span className="tile-text-placeholder">Click to add text…</span>}
    </div>
  );
}
