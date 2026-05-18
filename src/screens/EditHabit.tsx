import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, type Habit } from '../api/client';
import { IconTile } from '../components/IconTile';
import { SketchBox } from '../components/SketchBox';
import { HandIcon } from '../components/HandIcon';

const ICONS = [
  'dish','water','run','pill','book','mug','sun','moon','fire','star',
  'leaf','bolt','clock','target','dumb','bell','heart','music','phone','plus',
];

const TYPES = [
  { id: 'count', label: 'Contar',  hint: 'Cuenta cuántas veces lo haces (vasos, repeticiones…)' },
  { id: 'time',  label: 'Tiempo',  hint: 'Cronometra minutos (meditar, leer…)' },
  { id: 'yn',    label: 'Marcar',  hint: 'Sí/No · una vez al día' },
] as const;

type HabitType = typeof TYPES[number]['id'];

function apiTypeToDesign(t: Habit['type']): HabitType {
  if (t === 'time') return 'time';
  if (t === 'yn') return 'yn';
  return 'count';
}

interface StepperProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

function Stepper({ value, onChange, min = 0, max = 999, step = 1 }: StepperProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button
        onClick={() => onChange(Math.max(min, value - step))}
        className="font-display bg-transparent cursor-pointer"
        style={{
          width: 48, height: 48, borderRadius: 999,
          border: '1.8px solid var(--ink)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, lineHeight: 1, color: 'var(--ink)',
        }}
      >−</button>
      <span className="font-display text-center" style={{ fontSize: 42, minWidth: 64, lineHeight: 1 }}>{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + step))}
        className="font-display bg-transparent cursor-pointer"
        style={{
          width: 48, height: 48, borderRadius: 999,
          border: '1.8px solid var(--ink)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, lineHeight: 1, color: 'var(--ink)',
        }}
      >+</button>
    </div>
  );
}

export function EditHabit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [habit, setHabit] = useState<Habit | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('star');
  const [type, setType] = useState<HabitType>('count');
  const [goal, setGoal] = useState(3);
  const [pts, setPts] = useState(5);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    void api.habits.get(id).then((h) => {
      setHabit(h);
      setName(h.name);
      setIcon(h.icon);
      setType(apiTypeToDesign(h.type));
      setGoal(h.goal);
      setPts(h.points);
    });
  }, [id]);

  async function save() {
    if (!id || !name.trim()) return;
    setSaving(true);
    try {
      await api.habits.update(id, {
        name: name.trim(), icon,
        type: type === 'time' ? 'time' : type === 'yn' ? 'yn' : 'count',
        goal, points: pts,
      });
      navigate(-1);
    } finally {
      setSaving(false);
    }
  }

  async function archiveHabit() {
    if (!id || !habit) return;
    if (!confirm(`Archivar "${habit.name}"? Podrás restaurarlo después.`)) return;
    await api.habits.archive(id);
    navigate('/', { replace: true });
  }

  if (!habit) {
    return (
      <div className="screen items-center justify-center">
        <span className="font-hand text-ink-soft">Cargando…</span>
      </div>
    );
  }

  const isValid = name.trim().length > 0;
  const goalChips = type === 'time' ? [5, 10, 20, 30] : [1, 3, 5, 8];
  const ptsChips = [1, 2, 5, 10];

  return (
    <div className="screen">
      {/* Nav */}
      <div style={{ padding: '14px 14px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          onClick={() => navigate(-1)}
          className="font-hand cursor-pointer"
          style={{
            height: 36, padding: '0 14px', borderRadius: 999,
            border: '1.8px solid var(--ink)',
            display: 'inline-flex', alignItems: 'center',
            fontSize: 16, background: 'transparent', color: 'var(--ink)',
          }}
        >← cancelar</button>
        <span className="font-hand text-ink-soft" style={{ fontSize: 13 }}>Editar hábito</span>
        <button
          onClick={isValid ? () => void save() : undefined}
          className="font-hand cursor-pointer"
          style={{
            height: 36, padding: '0 14px', borderRadius: 999,
            border: `1.8px solid ${isValid ? 'var(--coral)' : 'var(--ink-soft)'}`,
            display: 'inline-flex', alignItems: 'center',
            fontSize: 16, background: 'transparent',
            color: isValid ? 'var(--coral)' : 'var(--ink-soft)',
          }}
        >guardar</button>
      </div>

      <div className="screen-scroll flex flex-col gap-[10px]" style={{ padding: '4px 18px 24px' }}>

        {/* Preview card */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 12px' }}>
          <SketchBox padding={12} radius={16} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--paper-2)' }}>
            <IconTile kind={icon} size={48} />
            <div>
              <div className="font-display" style={{ fontSize: 24, lineHeight: 1 }}>{name || 'Nombre del hábito'}</div>
              <div className="font-hand text-ink-soft" style={{ fontSize: 12, marginTop: 2 }}>
                {TYPES.find(t => t.id === type)?.label} · meta {goal}{type === 'time' ? ' min' : ''} · +{pts} pts
              </div>
            </div>
          </SketchBox>
        </div>

        {/* Name */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '6px 0' }}>
          <div className="font-hand text-ink-soft" style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.6 }}>Nombre</div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Beber agua"
            className="font-hand text-ink"
            style={{
              width: '100%', boxSizing: 'border-box',
              border: '1.8px solid var(--ink)', borderRadius: 12,
              background: 'transparent', padding: '12px 14px',
              fontSize: 19, outline: 'none',
            }}
          />
        </div>

        {/* Type segmented */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '6px 0' }}>
          <div className="font-hand text-ink-soft" style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.6 }}>Tipo</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {TYPES.map((t) => {
              const on = t.id === type;
              return (
                <button
                  key={t.id}
                  onClick={() => setType(t.id)}
                  className="font-hand cursor-pointer flex-1"
                  style={{
                    textAlign: 'center', padding: '10px 0',
                    border: '1.8px solid var(--ink)', borderRadius: 999,
                    background: on ? 'var(--ink)' : 'transparent',
                    color: on ? 'var(--paper)' : 'var(--ink)',
                    fontSize: 16,
                    transition: 'background 180ms',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >{t.label}</button>
              );
            })}
          </div>
          <div className="font-hand text-ink-soft" style={{ fontSize: 13 }}>
            {TYPES.find(t => t.id === type)?.hint}
          </div>
        </div>

        {/* Goal */}
        {type !== 'yn' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '6px 0' }}>
            <div className="font-hand text-ink-soft" style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.6 }}>
              {type === 'time' ? 'Meta · minutos / día' : 'Meta · veces / día'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
              <Stepper value={goal} onChange={setGoal} min={1} max={type === 'time' ? 240 : 50} step={type === 'time' ? 5 : 1} />
              <div style={{ display: 'flex', gap: 6 }}>
                {goalChips.map((v) => (
                  <button
                    key={v}
                    onClick={() => setGoal(v)}
                    className="font-hand cursor-pointer"
                    style={{
                      padding: '6px 10px', borderRadius: 999,
                      border: '1.6px solid var(--ink)',
                      background: v === goal ? 'var(--coral-soft)' : 'transparent',
                      fontSize: 13, color: 'var(--ink)',
                    }}
                  >{v}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Points */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '6px 0' }}>
          <div className="font-hand text-ink-soft" style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.6 }}>
            {type === 'time' ? 'Puntos · por minuto' : type === 'yn' ? 'Puntos · al completar' : 'Puntos · por cada uno'}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={() => setPts(Math.max(1, pts - 1))}
                className="font-display bg-transparent cursor-pointer"
                style={{
                  width: 38, height: 38, borderRadius: 999,
                  border: '1.8px solid var(--ink)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, lineHeight: 1, color: 'var(--ink)',
                }}
              >−</button>
              <span className="font-display text-center" style={{ fontSize: 30, minWidth: 44, lineHeight: 1 }}>{pts}</span>
              <button
                onClick={() => setPts(Math.min(50, pts + 1))}
                className="font-display bg-transparent cursor-pointer"
                style={{
                  width: 38, height: 38, borderRadius: 999,
                  border: '1.8px solid var(--ink)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, lineHeight: 1, color: 'var(--ink)',
                }}
              >+</button>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {ptsChips.map((v) => (
                <button
                  key={v}
                  onClick={() => setPts(v)}
                  className="font-hand cursor-pointer"
                  style={{
                    padding: '6px 10px', borderRadius: 999,
                    border: '1.6px solid var(--ink)',
                    background: v === pts ? 'var(--coral-soft)' : 'transparent',
                    fontSize: 13, color: 'var(--ink)',
                  }}
                >{v}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Icon picker */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '6px 0' }}>
          <div className="font-hand text-ink-soft" style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.6 }}>Ícono</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, padding: '4px 0' }}>
            {ICONS.map((k) => {
              const on = k === icon;
              return (
                <button
                  key={k}
                  onClick={() => setIcon(k)}
                  style={{
                    aspectRatio: '1 / 1', width: '100%', borderRadius: 12,
                    border: `1.8px solid ${on ? 'var(--coral)' : 'var(--ink)'}`,
                    background: on ? 'var(--coral-soft)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'background 160ms',
                  }}
                >
                  <HandIcon kind={k} size={22} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Archive */}
        <button
          onClick={() => void archiveHabit()}
          className="font-hand cursor-pointer"
          style={{
            padding: 12, textAlign: 'center', borderRadius: 999,
            border: '1.8px dashed var(--ink-soft)', color: 'var(--ink-soft)',
            fontSize: 15, background: 'transparent', width: '100%',
            marginTop: 8,
          }}
        >Archivar hábito</button>

        {/* Big save button */}
        <button
          onClick={isValid ? () => void save() : undefined}
          className="font-hand cursor-pointer"
          style={{
            padding: 14, textAlign: 'center', borderRadius: 999,
            border: `1.8px solid ${isValid ? 'var(--coral)' : 'var(--ink-soft)'}`,
            background: isValid ? 'var(--coral)' : 'rgba(217,119,87,0.35)',
            color: 'var(--paper)', fontSize: 18,
            transition: 'background 200ms',
            width: '100%',
          }}
          disabled={saving}
        >
          {saving ? '…' : 'Guardar cambios'}
        </button>

      </div>
    </div>
  );
}
