import { useState, useEffect } from 'react';
import { CalendarBlank, CaretLeft, CaretRight, X } from '@phosphor-icons/react';
import { BottomSheet } from './BottomSheet';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAYS = ['L','M','X','J','V','S','D'];

function monthCells(year: number, month: number): (number | null)[] {
  const pad = (new Date(year, month, 1).getDay() + 6) % 7;
  const total = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(pad).fill(null);
  for (let d = 1; d <= total; d++) cells.push(d);
  while (cells.length % 7) cells.push(null);
  return cells;
}

function toStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function todayStr() {
  const now = new Date();
  return toStr(now.getFullYear(), now.getMonth(), now.getDate());
}

function formatDisplay(s: string) {
  const [y, m, d] = s.split('-').map(Number);
  return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(y, m - 1, d));
}

interface DatePickerProps {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
  placeholder?: string;
  minDate?: string | null;
}

export function DatePicker({ label, value, onChange, placeholder = 'Sin fecha', minDate }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const now = new Date();
  const initYear = value ? parseInt(value.slice(0, 4)) : now.getFullYear();
  const initMonth = value ? parseInt(value.slice(5, 7)) - 1 : now.getMonth();
  const [viewYear, setViewYear] = useState(initYear);
  const [viewMonth, setViewMonth] = useState(initMonth);
  const [slideDir, setSlideDir] = useState<'left' | 'right' | null>(null);
  const today = todayStr();
  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();

  useEffect(() => {
    if (value) {
      setViewYear(parseInt(value.slice(0, 4)));
      setViewMonth(parseInt(value.slice(5, 7)) - 1);
    }
  }, [value]);

  function prev() {
    setSlideDir('left');
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function next() {
    setSlideDir('right');
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  function pick(day: number) {
    onChange(toStr(viewYear, viewMonth, day));
    setOpen(false);
  }

  const cells = monthCells(viewYear, viewMonth);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '12px 14px',
          border: '1.6px solid var(--ink)', borderRadius: 12,
          background: 'transparent', cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span className="font-hand text-ink-soft" style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.6 }}>
            {label}
          </span>
          <span className="font-hand" style={{ fontSize: 17, color: value ? 'var(--ink)' : 'var(--ink-soft)' }}>
            {value ? formatDisplay(value) : placeholder}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {value && (
            <span
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
              style={{ padding: 4, color: 'var(--ink-soft)', display: 'flex', cursor: 'pointer' }}
            >
              <X size={16} />
            </span>
          )}
          <CalendarBlank size={20} color="var(--ink-soft)" />
        </div>
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)}>
        {/* Label */}
        <div className="font-hand text-ink-soft" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>
          {label}
        </div>

        {/* Month nav — title absolutely centered */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <button
            type="button" onClick={prev}
            style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px 8px', color: 'var(--ink)', flexShrink: 0 }}
          >
            <CaretLeft size={22} />
          </button>

          {/* Centered title */}
          <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'none' }}>
            <span className="font-display" style={{ fontSize: 22, lineHeight: 1 }}>
              {MONTHS[viewMonth]} {viewYear}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {!isCurrentMonth && (
              <button
                type="button"
                onClick={() => { setViewYear(now.getFullYear()); setViewMonth(now.getMonth()); }}
                className="font-hand"
                style={{
                  border: '1.6px solid var(--coral)', borderRadius: 999,
                  background: 'transparent', color: 'var(--coral)',
                  fontSize: 12, padding: '2px 8px', cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent', pointerEvents: 'auto',
                }}
              >hoy</button>
            )}
            <button
              type="button" onClick={next}
              style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px 8px', color: 'var(--ink)' }}
            >
              <CaretRight size={22} />
            </button>
          </div>
        </div>

        {/* Day headers + grid — keyed so React remounts on month change, triggering slide */}
        <div key={`${viewYear}-${viewMonth}`} className={slideDir === 'right' ? 'dp-slide-right' : slideDir === 'left' ? 'dp-slide-left' : ''}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 6, borderBottom: '1.5px dashed var(--ink-soft)', paddingBottom: 6 }}>
          {DAYS.map(d => (
            <div key={d} className="font-hand text-ink-soft" style={{ textAlign: 'center', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {cells.map((day, i) => {
            if (!day) return <div key={i} style={{ height: 44 }} />;
            const ds = toStr(viewYear, viewMonth, day);
            const isSelected = ds === value;
            const isToday = ds === today;
            const disabled = !!minDate && ds < minDate;
            return (
              <button
                key={i}
                type="button"
                disabled={disabled}
                onClick={() => pick(day)}
                style={{
                  height: 44, borderRadius: 8,
                  border: isSelected
                    ? '1.6px solid var(--coral)'
                    : isToday
                    ? '1.6px solid var(--coral)'
                    : '1.6px solid transparent',
                  background: isSelected ? 'var(--coral)' : isToday ? 'var(--coral-soft)' : 'transparent',
                  color: isSelected ? 'var(--paper)' : disabled ? 'var(--ink-soft)' : 'var(--ink)',
                  fontSize: 14, cursor: disabled ? 'default' : 'pointer',
                  opacity: disabled ? 0.3 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: 0, WebkitTapHighlightColor: 'transparent',
                }}
                className="font-hand"
              >
                {day}
              </button>
            );
          })}
        </div>
        </div>{/* end slide wrapper */}

        {value && (
          <button
            type="button"
            onClick={() => { onChange(null); setOpen(false); }}
            style={{
              marginTop: 14, width: '100%', padding: '10px',
              border: '1.6px dashed var(--ink-soft)', borderRadius: 999,
              background: 'none', color: 'var(--ink-soft)', fontSize: 14,
              cursor: 'pointer',
            }}
            className="font-hand"
          >
            Quitar fecha
          </button>
        )}
      </BottomSheet>
    </>
  );
}
