import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useStats } from '../hooks/useStats';
import { useHabits } from '../hooks/useHabits';
import { api, type Habit } from '../api/client';
import { SketchBox } from '../components/SketchBox';
import { HandIcon } from '../components/HandIcon';
import { Scribble } from '../components/Scribble';

const TIMEZONES = [
  'UTC', 'America/Santo_Domingo', 'America/New_York', 'America/Chicago',
  'America/Denver', 'America/Los_Angeles', 'America/Mexico_City', 'America/Bogota',
  'America/Lima', 'America/Santiago', 'America/Buenos_Aires', 'Europe/Madrid',
];

function levelName(level: number): string {
  const names = ['Semilla', 'Brote', 'Plántula', 'Árbol', 'Roble', 'Bosque', 'Selva', 'Universo'];
  return names[Math.min(level - 1, names.length - 1)] ?? 'Maestro';
}

function SettingsRow({
  icon, label, detail, onTap, last, danger,
}: {
  icon: string; label: string; detail?: string;
  onTap?: () => void; last?: boolean; danger?: boolean;
}) {
  return (
    <div
      onClick={onTap}
      className={onTap ? 'cursor-pointer' : ''}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 14px',
        borderBottom: last ? 'none' : '1px dashed var(--ink-soft)',
      }}
    >
      <HandIcon kind={icon} size={18} color={danger ? 'var(--coral)' : 'var(--ink)'} />
      <span className="font-hand flex-1" style={{ fontSize: 15, color: danger ? 'var(--coral)' : 'var(--ink)' }}>{label}</span>
      {detail && <span className="font-hand text-ink-soft" style={{ fontSize: 13 }}>{detail}</span>}
      {onTap && <span className="font-hand text-ink-soft" style={{ fontSize: 16, marginLeft: 4 }}>›</span>}
    </div>
  );
}

export function Me() {
  const { user, logout, reload } = useAuth();
  const { stats } = useStats();
  const { habits } = useHabits();
  const navigate = useNavigate();
  const [editingTz, setEditingTz] = useState(false);
  const [tz, setTz] = useState(user?.timezone ?? 'UTC');
  const [saving, setSaving] = useState(false);
  const [archivedHabits, setArchivedHabits] = useState<Habit[]>([]);

  useEffect(() => {
    void api.habits.list(true).then(all => setArchivedHabits(all.filter(h => !!h.archived_at)));
  }, []);

  const level = stats?.level ?? 1;
  const xp = stats?.totalPoints ?? 0;
  const streak = stats?.streak ?? 0;
  const activeCount = habits.length;
  const archivedCount = archivedHabits.length;

  async function saveTz() {
    setSaving(true);
    await api.auth.patchMe({ timezone: tz });
    await reload();
    setSaving(false);
    setEditingTz(false);
  }

  const statItems = [
    { icon: 'star',  label: 'XP total',          value: `${xp.toLocaleString('es')} pts` },
    { icon: 'fire',  label: 'Racha actual',       value: `${streak}d${streak >= 3 ? ' 🔥' : ''}` },
    { icon: 'check', label: 'Hábitos activos',    value: String(activeCount) },
    { icon: 'clock', label: 'En la app',          value: `nivel ${level}` },
  ];

  return (
    <div className="screen">
      {/* Header */}
      <div style={{ padding: '14px 18px 6px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div className="font-display leading-none flex items-center" style={{ fontSize: 42, marginTop: 4 }}>
          Yo <Scribble width={36} style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: 6, marginTop: -2 }} />
        </div>
        <div className="font-hand text-ink-soft" style={{ fontSize: 16, marginTop: 2 }}>
          nivel {level} · {levelName(level)}
        </div>
      </div>

      <div className="screen-scroll flex flex-col gap-[10px]" style={{ padding: '4px 14px 20px' }}>

        {/* Profile card */}
        <SketchBox padding={14} radius={18} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {user?.avatar_url ? (
            <img
              src={user.avatar_url} alt=""
              style={{ width: 64, height: 64, borderRadius: 32, border: '2px solid var(--ink)', flexShrink: 0 }}
            />
          ) : (
            <div
              className="font-display flex items-center justify-center bg-coral-soft"
              style={{
                width: 64, height: 64, borderRadius: 32,
                border: '2px solid var(--ink)', fontSize: 34, lineHeight: 1,
                flexShrink: 0,
              }}
            >
              {(user?.display_name ?? '?')[0]?.toUpperCase()}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="font-display" style={{ fontSize: 28, lineHeight: 1 }}>{user?.display_name ?? 'Usuario'}</div>
            <div className="font-hand text-ink-soft" style={{ fontSize: 13, marginTop: 2 }}>
              Nivel {level} · {levelName(level)}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <span
                className="font-hand"
                style={{
                  padding: '3px 10px', borderRadius: 999,
                  border: '1.6px solid var(--coral)', color: 'var(--coral)',
                  fontSize: 13,
                }}
              >
                🔥 {streak}d
              </span>
              <span
                className="font-hand"
                style={{
                  padding: '3px 10px', borderRadius: 999,
                  border: '1.6px solid var(--ink)',
                  fontSize: 13,
                }}
              >
                {xp} XP
              </span>
            </div>
          </div>
        </SketchBox>

        {/* Stats */}
        <div className="font-hand text-ink-soft" style={{ fontSize: 12, letterSpacing: 0.6, padding: '4px 4px 0', textTransform: 'uppercase' }}>
          Tu progreso
        </div>
        <SketchBox padding={0} radius={14}>
          {statItems.map((it, i) => (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 16px',
                borderBottom: i === statItems.length - 1 ? 'none' : '1px dashed var(--ink-soft)',
              }}
            >
              <HandIcon kind={it.icon} size={20} />
              <span className="font-hand flex-1" style={{ fontSize: 16 }}>{it.label}</span>
              <span className="font-display" style={{ fontSize: 22, lineHeight: 1, whiteSpace: 'nowrap' }}>{it.value}</span>
            </div>
          ))}
        </SketchBox>

        {/* Settings */}
        <div className="font-hand text-ink-soft" style={{ fontSize: 12, letterSpacing: 0.6, padding: '4px 4px 0', textTransform: 'uppercase' }}>
          Ajustes
        </div>

        {/* Timezone */}
        <SketchBox padding={0} radius={14}>
          {editingTz ? (
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="font-hand text-ink-soft" style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>Zona horaria</div>
              <select
                value={tz}
                onChange={(e) => setTz(e.target.value)}
                className="font-hand bg-paper text-ink outline-none"
                style={{ fontSize: 16, border: '1px solid var(--ink-soft)', borderRadius: 8, padding: '6px 10px' }}
              >
                {TIMEZONES.map((z) => <option key={z} value={z}>{z}</option>)}
              </select>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => void saveTz()}
                  disabled={saving}
                  className="font-hand cursor-pointer"
                  style={{
                    padding: '8px 18px', borderRadius: 999,
                    border: '1.8px solid var(--coral)', background: 'var(--coral)',
                    color: 'var(--paper)', fontSize: 14,
                  }}
                >
                  {saving ? '…' : 'Guardar'}
                </button>
                <button
                  onClick={() => setEditingTz(false)}
                  className="font-hand cursor-pointer"
                  style={{
                    padding: '8px 18px', borderRadius: 999,
                    border: '1.8px solid var(--ink)', fontSize: 14, background: 'transparent',
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <SettingsRow
              icon="clock"
              label="Zona horaria"
              detail={user?.timezone ?? 'UTC'}
              onTap={() => setEditingTz(true)}
              last
            />
          )}
        </SketchBox>

        <SketchBox padding={0} radius={14}>
          <SettingsRow
            icon="leaf"
            label="Hábitos archivados"
            detail={String(archivedCount)}
            onTap={() => navigate('/habits/archived')}
          />
          <SettingsRow
            icon="bolt"
            label="Exportar datos"
            detail="json"
            onTap={() => {
              const data = JSON.stringify({ user, stats, habits });
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = 'habits.json'; a.click();
              URL.revokeObjectURL(url);
            }}
            last
          />
        </SketchBox>

        {/* Logout */}
        <SketchBox padding={0} radius={14}>
          <SettingsRow
            icon="heart"
            label="Cerrar sesión"
            onTap={() => { logout(); navigate('/login', { replace: true }); }}
            last
            danger
          />
        </SketchBox>

        <div className="font-hand text-ink-soft text-center" style={{ fontSize: 12, marginTop: 8 }}>
          hecho a mano · v0.1
        </div>

      </div>
    </div>
  );
}
