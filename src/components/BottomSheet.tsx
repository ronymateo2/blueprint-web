import { useEffect, useState } from 'react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  dismissable?: boolean;
}

export function BottomSheet({ open, onClose, children, dismissable = true }: BottomSheetProps) {
  const [render, setRender] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setRender(true);
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
      const t = setTimeout(() => setRender(false), 260);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!render) return null;

  return (
    <div
      style={{
        position: 'absolute', inset: 0, zIndex: 70,
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <div
        onClick={dismissable ? onClose : undefined}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(20, 18, 14, 0.35)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 220ms ease',
        }}
      />
      <div
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          background: 'var(--paper)',
          borderTop: '2px solid var(--ink)',
          borderTopLeftRadius: 22, borderTopRightRadius: 22,
          boxShadow: '0 -10px 26px rgba(0,0,0,0.08)',
          padding: '8px 18px 28px',
          maxHeight: '85%', overflow: 'auto',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 280ms cubic-bezier(.18,.85,.25,1.05)',
        }}
      >
        <div style={{ width: 44, height: 4, borderRadius: 2, background: 'var(--ink-soft)', opacity: 0.5, margin: '4px auto 8px' }} />
        {children}
      </div>
    </div>
  );
}
