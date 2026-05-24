import React, { useState } from 'react';
import { CaretDownIcon } from '@phosphor-icons/react';

interface CollapsibleProps {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  hasDivider?: boolean;
}

export function Collapsible({
  title,
  children,
  defaultExpanded = false,
  hasDivider = true,
}: CollapsibleProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <>
      {hasDivider && <div style={{ borderTop: '1.5px dashed var(--ink-soft)', margin: '6px 4px' }} />}
      <button
        onClick={() => setExpanded(!expanded)}
        className="font-display active:scale-98 transition-transform cursor-pointer flex items-center justify-between"
        style={{
          WebkitTapHighlightColor: 'transparent',
          fontSize: 24,
          color: 'var(--ink)',
          padding: '6px 4px',
          width: '100%',
          textAlign: 'left',
          border: 'none',
          background: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      >
        <span>{title}</span>
        <CaretDownIcon
          size={18}
          style={{
            color: 'var(--ink-soft)',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.25s ease-in-out',
          }}
        />
      </button>
      <div
        style={{
          maxHeight: expanded ? '1000px' : '0px',
          opacity: expanded ? 1 : 0,
          transition: 'max-height 0.28s ease-in-out, opacity 0.22s ease-in-out',
          overflow: expanded ? 'visible' : 'hidden',
        }}
      >
        <div className="flex flex-col gap-[10px]" style={{ paddingTop: '4px', paddingBottom: '4px' }}>
          {children}
        </div>
      </div>
    </>
  );
}
