import { useEffect, useState } from 'react';
import { SketchButton } from './SketchButton';

interface UndoToastProps {
  text: string;
  onUndo: () => void;
  onDismiss: () => void;
  durationMs?: number;
}

export function UndoToast({ text, onUndo, onDismiss, durationMs = 4000 }: UndoToastProps) {
  const [remaining, setRemaining] = useState(Math.ceil(durationMs / 1000));

  useEffect(() => {
    const timer = setTimeout(onDismiss, durationMs);
    const tick = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => { clearTimeout(timer); clearInterval(tick); };
  }, [durationMs, onDismiss]);

  return (
    <div
      className="absolute flex items-center justify-between bg-paper-2 z-50"
      style={{
        left: 16,
        right: 16,
        bottom: 90,
        border: '1.8px solid var(--ink)',
        borderRadius: 14,
        padding: '10px 14px',
        boxShadow: '2px 3px 0 rgba(0,0,0,0.08)',
        animation: 'slideUp 0.2s ease',
      }}
    >
      <div className="flex flex-col">
        <span className="font-hand" style={{ fontSize: 17 }}>Registrado · {text}</span>
        <span className="font-hand text-ink-soft" style={{ fontSize: 13 }}>
          cierra en {remaining}s
        </span>
      </div>
      <SketchButton small accent onClick={onUndo}>↶ Deshacer</SketchButton>
    </div>
  );
}
