import { useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { PencilSimpleIcon, PlayIcon, PlusIcon, CaretRight } from '@phosphor-icons/react';
import { useAuthContext } from '../context/AuthContext';
import { useHabits } from '../hooks/useHabits';
import { useNavDirection } from '../context/NavContext';
import { api } from '../api/client';
import { SketchBox } from '../components/ui/SketchBox';
import { Btn } from '../components/ui/Btn';
import { HandIcon } from '../components/ui/HandIcon';
import { BottomSheet } from '../components/ui/BottomSheet';
import { Scribble } from '../components/ui/Scribble';
import { IconTile } from '../components/habits/IconTile';
import { IdentityCard } from '../components/identity/IdentityCard';
import { MentalRehearsalSheet } from '../components/identity/MentalRehearsalSheet';

const INPUT_STYLE: CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  border: '1.8px solid var(--ink)', borderRadius: 12,
  background: 'transparent', padding: '12px 14px',
  fontSize: 17, outline: 'none', resize: 'none',
};

function PlayButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center justify-center shrink-0 border-none"
      style={{
        width: 46, height: 46, borderRadius: 23,
        background: disabled ? 'var(--ink-soft)' : 'var(--coral)',
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'default' : 'pointer',
        boxShadow: disabled ? 'none' : 'var(--shadow-sketch)',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <PlayIcon size={20} weight="fill" color="var(--paper)" />
    </button>
  );
}

export function Identity() {
  const { user, setUser } = useAuthContext();
  const { habits } = useHabits();
  const navigate = useNavigate();
  const { setDirection } = useNavDirection();

  const baseIdentity = user?.identity ?? '';
  const withIdentity = habits.filter((h) => !!h.identity);
  const withoutIdentity = habits.filter((h) => !h.identity);

  function goDetail(habitId: string) {
    setDirection('right');
    navigate(`/identity/${habitId}`);
  }

  // ── base identity editor ──
  const [editBaseOpen, setEditBaseOpen] = useState(false);
  const [baseText, setBaseText] = useState('');
  const [savingBase, setSavingBase] = useState(false);

  function openBaseEditor() {
    setBaseText(baseIdentity);
    setEditBaseOpen(true);
  }
  async function saveBase() {
    const value = baseText.trim();
    if (!value) return;
    setSavingBase(true);
    try {
      const updated = await api.auth.patchMe({ identity: value });
      setUser(updated);
      setEditBaseOpen(false);
    } finally {
      setSavingBase(false);
    }
  }

  // ── mental rehearsal (base identity) ──
  const [rehearsalOpen, setRehearsalOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="screen">
      {/* Header */}
      <div style={{ padding: '14px 18px 6px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div className="font-display leading-none flex items-center" style={{ fontSize: 42, marginTop: 4 }}>
          Identidad
          <Scribble width={40} style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: 6, marginTop: -2 }} />
        </div>
        <div className="font-hand text-ink-soft" style={{ fontSize: 16, marginTop: 2 }}>
          Cada hábito entrena quién eres
        </div>
      </div>

      <div className="screen-scroll flex flex-col gap-[10px]" style={{ padding: '4px 14px 20px' }}>

        {/* ── Base identity ── */}
        <div className="font-hand text-ink-soft" style={{ fontSize: 12, letterSpacing: 0.6, padding: '4px 4px 0', textTransform: 'uppercase' }}>
          Tu identidad base
        </div>
        <SketchBox accent padding={16} radius={18}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div
              className="flex items-center justify-center shrink-0"
              style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--paper)', border: '1.6px solid var(--coral)' }}
            >
              <HandIcon kind="identity" size={24} color="var(--coral)" />
            </div>
            <div className="font-display" style={{ flex: 1, fontSize: 26, lineHeight: 1.1, minWidth: 0 }}>
              {baseIdentity || 'Escribe tu identidad base'}
            </div>
            <button
              onClick={openBaseEditor}
              className="bg-transparent border-none cursor-pointer shrink-0"
              style={{ padding: 2, WebkitTapHighlightColor: 'transparent' }}
              aria-label="Editar identidad base"
            >
              <PencilSimpleIcon size={20} color="var(--ink)" />
            </button>
          </div>
          <div className="font-hand text-ink-soft" style={{ fontSize: 13, marginTop: 10 }}>
            Tu identidad guía tus decisiones y acciones.
          </div>
        </SketchBox>

        {/* ── Daily rehearsal ── */}
        <SketchBox padding={14} radius={16} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="font-display" style={{ fontSize: 22, lineHeight: 1 }}>Ensayo mental diario</div>
            <div className="font-hand text-ink-soft" style={{ fontSize: 13, marginTop: 3 }}>
              {baseIdentity ? '20s para conectar con tu identidad' : 'Escribe tu identidad base para empezar'}
            </div>
          </div>
          <PlayButton onClick={() => setRehearsalOpen(true)} disabled={!baseIdentity} />
        </SketchBox>

        {/* ── Per-habit identities ── */}
        <div className="font-hand text-ink-soft" style={{ fontSize: 12, letterSpacing: 0.6, padding: '10px 4px 0', textTransform: 'uppercase' }}>
          Identidad por hábito
        </div>

        {withIdentity.length === 0 ? (
          <div className="font-hand text-ink-soft text-center" style={{ fontSize: 14, padding: '8px 16px' }}>
            Asigna una identidad a los hábitos que quieras reforzar.
          </div>
        ) : (
          withIdentity.map((h) => (
            <IdentityCard key={h.id} habit={h} onClick={() => goDetail(h.id)} />
          ))
        )}

        <Btn variant="outline" size="md" fullWidth onClick={() => setPickerOpen(true)} style={{ marginTop: 4 }}>
          <PlusIcon size={18} /> Agregar identidad a un hábito
        </Btn>

      </div>

      {/* ── Sheets ── */}

      {/* Base identity editor */}
      <BottomSheet open={editBaseOpen} onClose={() => setEditBaseOpen(false)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '6px 2px 4px' }}>
          <div className="font-display" style={{ fontSize: 24, lineHeight: 1 }}>Tu identidad base</div>
          <div className="font-hand text-ink-soft" style={{ fontSize: 14 }}>
            Ej. “Soy una persona que no abandona.”
          </div>
          <textarea
            value={baseText}
            onChange={(e) => setBaseText(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Soy una persona que…"
            className="font-hand text-ink"
            style={INPUT_STYLE}
          />
          <Btn variant="primary" size="lg" fullWidth loading={savingBase} onClick={() => void saveBase()}>
            Guardar
          </Btn>
        </div>
      </BottomSheet>

      {/* Habit picker → opens detail screen */}
      <BottomSheet open={pickerOpen} onClose={() => setPickerOpen(false)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '6px 2px 4px' }}>
          <div className="font-display" style={{ fontSize: 24, lineHeight: 1, marginBottom: 4 }}>Elige un hábito</div>
          {withoutIdentity.length === 0 ? (
            <div className="font-hand text-ink-soft text-center" style={{ fontSize: 14, padding: '12px 0' }}>
              Todos tus hábitos ya tienen identidad.
            </div>
          ) : (
            withoutIdentity.map((h) => (
              <div
                key={h.id}
                onClick={() => { setPickerOpen(false); goDetail(h.id); }}
                className="cursor-pointer"
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 4px' }}
              >
                <IconTile kind={h.icon} size={44} />
                <span className="font-display flex-1" style={{ fontSize: 20 }}>{h.name}</span>
                <CaretRight size={18} className="text-ink-soft" />
              </div>
            ))
          )}
        </div>
      </BottomSheet>

      {/* Mental rehearsal (base identity) */}
      <MentalRehearsalSheet open={rehearsalOpen} onClose={() => setRehearsalOpen(false)} identity={baseIdentity} />

    </div>
  );
}
