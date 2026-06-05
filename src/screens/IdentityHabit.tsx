import { useState, useMemo, type CSSProperties } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, PencilSimpleIcon, PlayIcon } from '@phosphor-icons/react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { HABITS_KEY, useHabits } from '../hooks/useHabits';
import { useNavDirection } from '../context/NavContext';
import { useAuthContext } from '../context/AuthContext';
import { useEntries } from '../hooks/useEntries';
import { utcToLocalDate, todayLocalDate, addDays, localDayUtcRange } from '../lib/dateUtils';
import { isHabitDueOnDate } from '../lib/habitUtils';
import { SketchBox } from '../components/ui/SketchBox';
import { Ring } from '../components/ui/Ring';
import { Btn } from '../components/ui/Btn';
import { BottomSheet } from '../components/ui/BottomSheet';
import { IconTile } from '../components/habits/IconTile';
import { MentalRehearsalSheet } from '../components/identity/MentalRehearsalSheet';

function LegendRow({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span className="font-hand" style={{ fontSize: 14 }}>{label}</span>
    </div>
  );
}

const INPUT_STYLE: CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  border: '1.8px solid var(--ink)', borderRadius: 12,
  background: 'transparent', padding: '12px 14px',
  fontSize: 17, outline: 'none', resize: 'none',
};

export function IdentityHabit() {
  const { habitId } = useParams();
  const navigate = useNavigate();
  const { setDirection } = useNavDirection();
  const queryClient = useQueryClient();
  const { habits, loading } = useHabits();

  const habit = habits.find((h) => h.id === habitId);
  const { timezone } = useAuthContext();

  const { weekFrom, weekTo, weekDays } = useMemo(() => {
    const today = todayLocalDate(timezone);
    const dow = (new Date(`${today}T12:00:00Z`).getUTCDay() + 6) % 7; // Mon=0, Sun=6
    const monday = addDays(today, -dow);
    const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
    return {
      weekFrom: localDayUtcRange(days[0], timezone).from,
      weekTo: localDayUtcRange(days[6], timezone).to,
      weekDays: days,
    };
  }, [timezone]);

  const { entries: weekEntries } = useEntries({ habitId, from: weekFrom, to: weekTo });

  const weekStats = useMemo(() => {
    if (!habit) return { completados: 0, parcial: 0, fallado: 0, total: 0 };
    const today = todayLocalDate(timezone);
    const byDate: Record<string, number> = {};
    for (const e of weekEntries) {
      const d = utcToLocalDate(e.logged_at, timezone);
      byDate[d] = (byDate[d] ?? 0) + e.value;
    }
    let completados = 0, parcial = 0, fallado = 0, total = 0;
    for (const day of weekDays) {
      if (!isHabitDueOnDate(habit, day, timezone)) continue;
      total++;
      if (day > today) continue;
      const sum = byDate[day] ?? 0;
      if (sum >= habit.goal) completados++;
      else if (sum > 0) parcial++;
      else fallado++;
    }
    return { completados, parcial, fallado, total };
  }, [weekEntries, weekDays, habit, timezone]);

  const [editOpen, setEditOpen] = useState(false);
  const [identityText, setIdentityText] = useState('');
  const [minActionText, setMinActionText] = useState('');
  const [saving, setSaving] = useState(false);
  const [rehearsalOpen, setRehearsalOpen] = useState(false);

  function back() {
    setDirection('left');
    navigate('/identity');
  }

  function openEditor() {
    if (!habit) return;
    setIdentityText(habit.identity ?? '');
    setMinActionText(habit.min_action ?? '');
    setEditOpen(true);
  }

  async function saveIdentity() {
    if (!habit) return;
    const value = identityText.trim();
    if (!value) return;
    setSaving(true);
    try {
      await api.habits.update(habit.id, { identity: value, min_action: minActionText.trim() || null });
      await queryClient.invalidateQueries({ queryKey: HABITS_KEY });
      setEditOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function removeIdentity() {
    if (!habit) return;
    setSaving(true);
    try {
      await api.habits.update(habit.id, { identity: null, min_action: null });
      await queryClient.invalidateQueries({ queryKey: HABITS_KEY });
      back();
    } finally {
      setSaving(false);
    }
  }

  if (!habit) {
    return (
      <div className="screen">
        <div style={{ padding: '14px 14px 4px' }}>
          <Btn onClick={back} style={{ height: 36, padding: '0 14px', fontSize: 16 }}><ArrowLeft size={16} /> volver</Btn>
        </div>
        <div className="screen-scroll flex items-center justify-center font-hand text-ink-soft" style={{ fontSize: 15 }}>
          {loading ? 'Cargando…' : 'Hábito no encontrado'}
        </div>
      </div>
    );
  }

  const hasIdentity = !!habit.identity;

  return (
    <div className="screen">
      {/* Nav */}
      <div style={{ padding: '14px 14px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Btn onClick={back} style={{ height: 36, padding: '0 14px', fontSize: 16 }}><ArrowLeft size={16} /></Btn>
        <span className="font-display" style={{ fontSize: 22 }}>{habit.name}</span>
        <div style={{ width: 52 }} />
      </div>

      <div className="screen-scroll flex flex-col gap-[12px]" style={{ padding: '8px 14px 24px' }}>

        {/* Identity card */}
        <SketchBox accent padding={16} radius={18}>
          <div className="font-hand text-ink-soft" style={{ fontSize: 13, marginBottom: 6 }}>Identidad de este hábito</div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <IconTile kind={habit.icon} size={48} />
            <div className="font-display" style={{ flex: 1, fontSize: 26, lineHeight: 1.1, minWidth: 0 }}>
              {habit.identity || 'Define la identidad de este hábito'}
            </div>
            <button
              onClick={openEditor}
              className="bg-transparent border-none cursor-pointer shrink-0"
              style={{ padding: 2, WebkitTapHighlightColor: 'transparent' }}
              aria-label="Editar identidad"
            >
              <PencilSimpleIcon size={20} color="var(--ink)" />
            </button>
          </div>
          <div className="font-hand text-ink-soft" style={{ fontSize: 13, marginTop: 10 }}>
            Cada vez que lo haces, demuestras quién eres.
          </div>
        </SketchBox>

        {/* Weekly progress */}
        <SketchBox padding={14} radius={16}>
          <div className="font-hand text-ink-soft" style={{ fontSize: 13, marginBottom: 10 }}>Progreso esta semana</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Ring
              size={90}
              value={weekStats.total > 0 ? weekStats.completados / weekStats.total : 0}
              color="var(--coral)"
              stroke={8}
              label={weekStats.total > 0 ? `${Math.round((weekStats.completados / weekStats.total) * 100)}%` : '—'}
              labelSize={22}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <LegendRow color="#7cbf6e" label={`${weekStats.completados} ${weekStats.completados === 1 ? 'completado' : 'completados'}`} />
              <LegendRow color="var(--ink-soft)" label={`${weekStats.parcial} ${weekStats.parcial === 1 ? 'parcial' : 'parciales'}`} />
              <LegendRow color="var(--coral)" label={`${weekStats.fallado} ${weekStats.fallado === 1 ? 'fallado' : 'fallados'}`} />
            </div>
          </div>
        </SketchBox>

        {/* Mental rehearsal */}
        <SketchBox padding={14} radius={16} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="font-display" style={{ fontSize: 20, lineHeight: 1 }}>Ensayo mental (20s)</div>
            <div className="font-hand text-ink-soft" style={{ fontSize: 13, marginTop: 3 }}>
              {hasIdentity ? 'Visualízate cumpliendo, incluso en días difíciles.' : 'Define la identidad para ensayar.'}
            </div>
          </div>
          <button
            onClick={() => setRehearsalOpen(true)}
            disabled={!hasIdentity}
            className="flex items-center justify-center shrink-0 border-none"
            style={{
              width: 46, height: 46, borderRadius: 23,
              background: hasIdentity ? 'var(--coral)' : 'var(--ink-soft)',
              opacity: hasIdentity ? 1 : 0.4,
              cursor: hasIdentity ? 'pointer' : 'default',
              boxShadow: hasIdentity ? 'var(--shadow-sketch)' : 'none',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <PlayIcon size={20} weight="fill" color="var(--paper)" />
          </button>
        </SketchBox>

        {/* Minimum action */}
        <div className="font-hand text-ink-soft" style={{ fontSize: 12, letterSpacing: 0.6, padding: '6px 4px 0', textTransform: 'uppercase' }}>
          Acción mínima de hoy
        </div>
        <div className="font-hand text-ink-soft" style={{ fontSize: 13, padding: '0 4px' }}>
          Si no puedes hacer todo, haz esto:
        </div>
        <SketchBox padding={14} radius={16} onClick={openEditor} className="cursor-pointer">
          <div className="font-display" style={{ fontSize: 20, lineHeight: 1.1 }}>
            {habit.min_action || 'Define tu acción mínima'}
          </div>
          <div className="font-hand text-ink-soft" style={{ fontSize: 13, marginTop: 3 }}>Lo mínimo cuenta.</div>
        </SketchBox>

        <Btn
          variant="primary"
          size="lg"
          fullWidth
          onClick={() => { setDirection('right'); navigate(`/identity/${habit.id}/registrar`); }}
          style={{ marginTop: 8 }}
        >
          Continuar y registrar
        </Btn>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="outline" size="md" onClick={() => { setDirection('right'); navigate(`/identity/${habit.id}/evidencia/hoy`); }} style={{ flex: 1 }}>
            Evidencia de hoy
          </Btn>
          <Btn variant="outline" size="md" onClick={() => { setDirection('right'); navigate(`/identity/${habit.id}/progreso`); }} style={{ flex: 1 }}>
            Progreso
          </Btn>
        </div>
      </div>

      {/* Identity editor */}
      <BottomSheet open={editOpen} onClose={() => setEditOpen(false)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '6px 2px 4px' }}>
          <div className="font-display" style={{ fontSize: 24, lineHeight: 1 }}>{habit.name}</div>

          <div className="font-hand text-ink-soft" style={{ fontSize: 13 }}>Identidad de este hábito</div>
          <textarea
            value={identityText}
            onChange={(e) => setIdentityText(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Soy alguien que…"
            className="font-hand text-ink"
            style={INPUT_STYLE}
          />

          <div className="font-hand text-ink-soft" style={{ fontSize: 13 }}>Acción mínima de hoy</div>
          <input
            type="text"
            value={minActionText}
            onChange={(e) => setMinActionText(e.target.value)}
            maxLength={300}
            placeholder="Ej. Entrenar 5 minutos"
            className="font-hand text-ink"
            style={INPUT_STYLE}
          />

          <Btn variant="primary" size="lg" fullWidth loading={saving} onClick={() => void saveIdentity()}>Guardar</Btn>
          {hasIdentity && (
            <Btn variant="danger" size="md" fullWidth disabled={saving} onClick={() => void removeIdentity()}>
              Quitar identidad
            </Btn>
          )}
        </div>
      </BottomSheet>

      {/* Mental rehearsal */}
      <MentalRehearsalSheet open={rehearsalOpen} onClose={() => setRehearsalOpen(false)} identity={habit.identity ?? ''} />
    </div>
  );
}
