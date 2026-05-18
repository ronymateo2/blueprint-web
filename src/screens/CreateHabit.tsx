import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { IconTile } from '../components/IconTile';
import { SketchBox } from '../components/SketchBox';
import { SketchButton } from '../components/SketchButton';

const ICONS = ['dish','water','mug','pill','book','run','dumb','sun','moon','fire','star','leaf','bolt','clock','target','bell','heart','music','phone','plus'];

const TYPES = [
  { id: 'count', label: 'Contar veces', hint: 'lavar platos · vitaminas' },
  { id: 'time',  label: 'Duración',     hint: 'meditar 15 min · correr 20 min' },
  { id: 'yn',    label: 'Sí / No diario', hint: 'tomar agua · sin azúcar' },
  { id: 'qty',   label: 'Cantidad con unidad', hint: 'agua: 8 vasos · 2 L' },
  { id: 'at',    label: 'A hora específica',  hint: 'medicina 8:00am' },
] as const;

const POINTS_OPTIONS = [1, 5, 10, 20];

export function CreateHabit() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('star');
  const [type, setType] = useState<'count'|'time'|'yn'|'qty'|'at'>('count');
  const [goal, setGoal] = useState(1);
  const [unit, setUnit] = useState('');
  const [points, setPoints] = useState(5);
  const [reminder, setReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState('20:00');
  const [saving, setSaving] = useState(false);
  const [showMoreIcons, setShowMoreIcons] = useState(false);

  const visibleIcons = showMoreIcons ? ICONS : ICONS.slice(0, 18);

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const habit = await api.habits.create({ name: name.trim(), icon, type, goal, unit: unit || null, points, sort_order: 0 });
      if (reminder) {
        await api.reminders.create(habit.id, { time: reminderTime, days: 'LMXJVSD', enabled: 1 });
      }
      navigate('/', { replace: true });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="screen">
      {/* Nav */}
      <div className="flex items-center justify-between" style={{ padding: '14px 18px 8px', borderBottom: '1px solid var(--paper-2)' }}>
        <button onClick={() => navigate(-1)} className="bg-transparent border-none cursor-pointer font-hand text-ink-soft" style={{ fontSize: 14 }}>Cancelar</button>
        <span className="font-display" style={{ fontSize: 22 }}>Nuevo hábito</span>
        <button
          onClick={() => void save()}
          disabled={!name.trim() || saving}
          className="bg-transparent border-none cursor-pointer font-hand text-coral"
          style={{ fontSize: 14, fontWeight: 700, opacity: (!name.trim() || saving) ? 0.4 : 1 }}
        >
          {saving ? '…' : 'Guardar'}
        </button>
      </div>

      <div className="screen-scroll flex flex-col gap-[12px]" style={{ padding: '10px 14px' }}>

        {/* Nombre + icon preview */}
        <SketchBox padding={10} className="flex items-center gap-[10px]">
          <IconTile kind={icon} size={50} dashed />
          <div className="flex-1">
            <div className="font-hand text-ink-soft" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>nombre</div>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Lavar platos"
              className="font-display leading-none bg-transparent w-full outline-none text-ink"
              style={{
                fontSize: 22,
                border: 'none', borderBottom: '1.5px dashed var(--ink)',
                paddingBottom: 2,
              }}
            />
          </div>
        </SketchBox>

        {/* Icono picker */}
        <div>
          <div className="font-hand text-ink-soft" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 4px 6px' }}>icono</div>
          <SketchBox padding={8}>
            <div className="grid gap-[6px]" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
              {visibleIcons.map((k) => (
                <IconTile key={k} kind={k} size={42} selected={icon === k} onClick={() => setIcon(k)} />
              ))}
            </div>
            {!showMoreIcons && (
              <button
                onClick={() => setShowMoreIcons(true)}
                className="block w-full font-hand text-ink-soft bg-transparent border-none cursor-pointer text-center"
                style={{ marginTop: 8, fontSize: 11 }}
              >
                ··· ver todos ⌄
              </button>
            )}
          </SketchBox>
        </div>

        {/* Tipo */}
        <div>
          <div className="font-hand text-ink-soft" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 4px 6px' }}>tipo</div>
          <SketchBox padding={6}>
            {TYPES.map((t) => (
              <div
                key={t.id}
                onClick={() => setType(t.id)}
                className="flex items-center gap-[10px] cursor-pointer"
                style={{ padding: '8px 6px', borderBottom: '1px dashed var(--ink-soft)' }}
              >
                <div className="flex items-center justify-center shrink-0" style={{ width: 18, height: 18, borderRadius: 9, border: '1.6px solid var(--ink)' }}>
                  {type === t.id && <div className="bg-coral" style={{ width: 10, height: 10, borderRadius: 5 }} />}
                </div>
                <div className="flex-1">
                  <div className="font-hand" style={{ fontSize: 14, lineHeight: 1.1 }}>{t.label}</div>
                  <div className="font-hand text-ink-soft" style={{ fontSize: 11 }}>{t.hint}</div>
                </div>
              </div>
            ))}
          </SketchBox>
        </div>

        {/* Meta */}
        {type !== 'yn' && (
          <SketchBox padding={10}>
            <div className="font-hand text-ink-soft" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
              meta · {type === 'time' ? 'minutos al día' : type === 'qty' ? 'cantidad al día' : 'veces al día'}
            </div>
            <div className="flex items-center gap-[10px]">
              <SketchButton style={{ padding: '4px 14px', fontSize: 22 }} onClick={() => setGoal((g) => Math.max(1, g - 1))}>−</SketchButton>
              <span className="font-display text-center" style={{ fontSize: 32, minWidth: 36 }}>{goal}</span>
              <SketchButton style={{ padding: '4px 14px', fontSize: 22 }} onClick={() => setGoal((g) => g + 1)}>+</SketchButton>
              {(type === 'qty' || type === 'time') && (
                <input
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder={type === 'time' ? 'min' : 'vasos'}
                  className="font-hand bg-transparent outline-none text-ink"
                  style={{ fontSize: 13, border: 'none', borderBottom: '1px dashed var(--ink-soft)', width: 60, marginLeft: 'auto' }}
                />
              )}
            </div>
          </SketchBox>
        )}

        {/* Puntos */}
        <SketchBox padding={10}>
          <div className="flex justify-between items-center">
            <div>
              <div className="font-hand text-ink-soft" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>puntos por registro</div>
              <div className="font-display leading-none" style={{ fontSize: 26, marginTop: 2 }}>+{points} pts</div>
            </div>
            <div className="flex gap-[6px]">
              {POINTS_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => setPoints(n)}
                  className="font-hand cursor-pointer"
                  style={{
                    padding: '4px 10px', borderRadius: 'var(--radius-pill)',
                    border: '1.6px solid var(--ink)', fontSize: 13,
                    background: points === n ? 'var(--ink)' : 'transparent',
                    color: points === n ? 'var(--paper)' : 'var(--ink)',
                  }}
                >{n}</button>
              ))}
            </div>
          </div>
        </SketchBox>

        {/* Recordatorio */}
        <SketchBox padding={10}>
          <div className="flex justify-between items-center">
            <div>
              <div className="font-hand" style={{ fontSize: 14 }}>Recordarme</div>
              {reminder && (
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="font-hand text-ink-soft bg-transparent outline-none border-none"
                  style={{ fontSize: 13, marginTop: 2 }}
                />
              )}
              {!reminder && <div className="font-hand text-ink-soft" style={{ fontSize: 11 }}>toca para activar</div>}
            </div>
            {/* Toggle */}
            <div
              onClick={() => setReminder((r) => !r)}
              className="flex items-center cursor-pointer"
              style={{
                width: 46, height: 26, borderRadius: 13,
                border: '1.6px solid var(--ink)',
                background: reminder ? 'var(--coral)' : 'transparent',
                padding: 2,
                justifyContent: reminder ? 'flex-end' : 'flex-start',
                transition: 'background 0.2s',
              }}
            >
              <div className="bg-paper" style={{ width: 18, height: 18, borderRadius: 9, border: '1.4px solid var(--ink)' }} />
            </div>
          </div>
        </SketchBox>

        <div style={{ height: 40 }} />
      </div>
    </div>
  );
}
