import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FireIcon, CaretRight } from '@phosphor-icons/react';
import { useAuthContext } from '../context/AuthContext';
import { useHabits } from '../hooks/useHabits';
import { api, type Habit, type MeStats } from '../api/client';
import { SketchBox } from '../components/ui/SketchBox';
import { HandIcon } from '../components/ui/HandIcon';
import { Scribble } from '../components/ui/Scribble';
import { Btn } from '../components/ui/Btn';

const HAND_FONTS: { label: string; value: string }[] = [
  { label: 'Patrick Hand',  value: "'Patrick Hand', cursive" },
  { label: 'Balsamiq Sans', value: "'Balsamiq Sans', cursive" },
  { label: 'Comic Neue',    value: "'Comic Neue', cursive" },
  { label: 'Itim',          value: "'Itim', cursive" },
  { label: 'Fredoka',       value: "'Fredoka', cursive" },
  { label: 'Quicksand',     value: "'Quicksand', sans-serif" },
];

const DISPLAY_FONTS: { label: string; value: string }[] = [
  { label: 'Caveat',           value: "'Caveat', cursive" },
  { label: 'Kalam',            value: "'Kalam', cursive" },
  { label: 'Handlee',          value: "'Handlee', cursive" },
  { label: 'Edu QLD Beginner', value: "'Edu QLD Beginner', cursive" },
];

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
  icon, label, detail, onTap, last, danger, isLoading,
}: {
  icon: string; label: string; detail?: string;
  onTap?: () => void; last?: boolean; danger?: boolean;
  isLoading?: boolean;
}) {
  return (
    <div
      onClick={onTap}
      className={onTap ? 'cursor-pointer' : ''}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 14px',
        borderBottom: last ? 'none' : '1.6px dashed var(--ink-soft)',
      }}
    >
      <HandIcon kind={icon} size={18} color={danger ? 'var(--coral)' : 'var(--ink)'} />
      <span className="font-hand flex-1" style={{ fontSize: 15, color: danger ? 'var(--coral)' : 'var(--ink)' }}>{label}</span>
      {isLoading ? (
        <div className="skeleton-pulse" style={{ height: 14, width: 45, backgroundColor: 'rgba(42, 42, 42, 0.08)', borderRadius: 3 }} />
      ) : (
        detail && <span className="font-hand text-ink-soft" style={{ fontSize: 13 }}>{detail}</span>
      )}
      {onTap && <CaretRight size={16} className="text-ink-soft" style={{ marginLeft: 4, flexShrink: 0 }} />}
    </div>
  );
}

export function Me() {
  const { user, logout, setUser } = useAuthContext();
  const { habits, loading: loadingHabits } = useHabits();
  const navigate = useNavigate();
  const [editingTz, setEditingTz] = useState(false);
  const [tz, setTz] = useState(user?.timezone ?? 'UTC');
  const [saving, setSaving] = useState(false);
  const [archivedHabits, setArchivedHabits] = useState<Habit[]>([]);
  const [loadingArchived, setLoadingArchived] = useState(true);
  const [stats, setStats] = useState<MeStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [editingFont, setEditingFont] = useState(false);
  const [displayFont, setDisplayFont] = useState(
    () => localStorage.getItem('habit_display_font') ?? DISPLAY_FONTS[0].value
  );
  const [editingHandFont, setEditingHandFont] = useState(false);
  const [handFont, setHandFont] = useState(
    () => localStorage.getItem('habit_hand_font') ?? HAND_FONTS[0].value
  );

  useEffect(() => {
    void api.stats.getMe().then(setStats).finally(() => setLoadingStats(false));
  }, []);

  useEffect(() => {
    setLoadingArchived(true);
    void api.habits.list(true)
      .then(all => setArchivedHabits(all.filter(h => !!h.archived_at)))
      .finally(() => setLoadingArchived(false));
  }, []);

  const isLoading = loadingStats || loadingHabits || loadingArchived;

  const level = stats?.level ?? 1;
  const xp = stats?.totalPoints ?? 0;
  const streak = stats?.streak ?? 0;
  const activeCount = habits.length;
  const archivedCount = archivedHabits.length;

  async function saveTz() {
    setSaving(true);
    const result = await api.auth.patchMe({ timezone: tz });
    if (result.token) localStorage.setItem('habit_token', result.token);
    setUser({ ...user!, timezone: tz });
    setSaving(false);
    setEditingTz(false);
  }

  function saveFont(value: string) {
    localStorage.setItem('habit_display_font', value);
    document.documentElement.style.setProperty('--font-display', value);
    setDisplayFont(value);
    setEditingFont(false);
  }

  function saveHandFont(value: string) {
    localStorage.setItem('habit_hand_font', value);
    document.documentElement.style.setProperty('--font-hand', value);
    setHandFont(value);
    setEditingHandFont(false);
  }

  const statItems = [
    { icon: 'star',  label: 'XP total',          value: `${xp.toLocaleString('es')} pts` },
    { icon: 'fire',  label: 'Racha actual',       value: `${streak}d` },
    { icon: 'check', label: 'Hábitos activos',    value: String(activeCount) },
    { icon: 'clock', label: 'En la app',          value: `nivel ${level}` },
  ];

  return (
    <div className="screen">
      <style>{`
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.38; }
        }
        .skeleton-pulse {
          animation: skeleton-pulse 1.5s ease-in-out infinite;
        }
      `}</style>
      
      {/* Header */}
      <div style={{ padding: '14px 18px 6px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div className="font-display leading-none flex items-center" style={{ fontSize: 42, marginTop: 4 }}>
          Yo <Scribble width={36} style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: 6, marginTop: -2 }} />
        </div>
        {isLoading ? (
          <div className="skeleton-pulse" style={{ height: 16, width: 120, backgroundColor: 'rgba(42, 42, 42, 0.08)', borderRadius: 4, marginTop: 6 }} />
        ) : (
          <div className="font-hand text-ink-soft" style={{ fontSize: 16, marginTop: 2 }}>
            nivel {level} · {levelName(level)}
          </div>
        )}
      </div>

      <div className="screen-scroll flex flex-col gap-[10px]" style={{ padding: '4px 14px 20px' }}>

        {/* Profile card */}
        <SketchBox padding={14} radius={18} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {isLoading ? (
            <div className="skeleton-pulse" style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(42, 42, 42, 0.12)', flexShrink: 0 }} />
          ) : user?.avatar_url ? (
            <img
              src={user.avatar_url} alt=""
              style={{ width: 64, height: 64, borderRadius: 32, border: '1.6px solid var(--ink)', flexShrink: 0 }}
            />
          ) : (
            <div
              className="font-display flex items-center justify-center bg-coral-soft"
              style={{
                width: 64, height: 64, borderRadius: 32,
                border: '1.6px solid var(--ink)', fontSize: 34, lineHeight: 1,
                flexShrink: 0,
              }}
            >
              {(user?.display_name ?? '?')[0]?.toUpperCase()}
            </div>
          )}
          
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 0 }}>
              <div className="skeleton-pulse" style={{ height: 24, width: '60%', backgroundColor: 'rgba(42, 42, 42, 0.12)', borderRadius: 4 }} />
              <div className="skeleton-pulse" style={{ height: 14, width: '40%', backgroundColor: 'rgba(42, 42, 42, 0.08)', borderRadius: 3 }} />
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <div className="skeleton-pulse" style={{ height: 22, width: 45, backgroundColor: 'rgba(235, 94, 85, 0.08)', borderRadius: 999 }} />
                <div className="skeleton-pulse" style={{ height: 22, width: 55, backgroundColor: 'rgba(42, 42, 42, 0.08)', borderRadius: 999 }} />
              </div>
            </div>
          ) : (
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
                  <FireIcon size={13} weight="fill" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />
                  {streak}d
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
          )}
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
                borderBottom: i === statItems.length - 1 ? 'none' : '1.6px dashed var(--ink-soft)',
              }}
            >
              <HandIcon kind={it.icon} size={20} />
              <span className="font-hand flex-1" style={{ fontSize: 16 }}>{it.label}</span>
              {isLoading ? (
                <div className="skeleton-pulse" style={{ height: 20, width: 55, backgroundColor: 'rgba(42, 42, 42, 0.12)', borderRadius: 4 }} />
              ) : (
                <span className="font-display" style={{ fontSize: 22, lineHeight: 1, whiteSpace: 'nowrap' }}>{it.value}</span>
              )}
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
                style={{ fontSize: 16, border: '1.5px solid var(--ink-soft)', borderRadius: 8, padding: '6px 10px' }}
              >
                {TIMEZONES.map((z) => <option key={z} value={z}>{z}</option>)}
              </select>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn variant="primary" size="sm" loading={saving} onClick={() => void saveTz()}>Guardar</Btn>
                <Btn size="sm" onClick={() => setEditingTz(false)}>Cancelar</Btn>
              </div>
            </div>
          ) : (
            <SettingsRow
              icon="clock"
              label="Zona horaria"
              detail={user?.timezone ?? 'UTC'}
              onTap={() => setEditingTz(true)}
              isLoading={isLoading}
              last
            />
          )}
        </SketchBox>

        {/* Display font */}
        <SketchBox padding={0} radius={14}>
          {editingFont ? (
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="font-hand text-ink-soft" style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>Fuente display</div>
              <select
                value={displayFont}
                onChange={(e) => saveFont(e.target.value)}
                className="font-hand bg-paper text-ink outline-none"
                style={{ fontSize: 16, border: '1.5px solid var(--ink-soft)', borderRadius: 8, padding: '6px 10px' }}
              >
                {DISPLAY_FONTS.map((f) => (
                  <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
                ))}
              </select>
              <div>
                <Btn size="sm" onClick={() => setEditingFont(false)}>Cancelar</Btn>
              </div>
            </div>
          ) : (
            <SettingsRow
              icon="star"
              label="Fuente display"
              detail={DISPLAY_FONTS.find(f => f.value === displayFont)?.label ?? 'Caveat'}
              onTap={() => setEditingFont(true)}
              isLoading={isLoading}
              last
            />
          )}
        </SketchBox>

        {/* Hand font */}
        <SketchBox padding={0} radius={14}>
          {editingHandFont ? (
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="font-hand text-ink-soft" style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>Fuente hand</div>
              <select
                value={handFont}
                onChange={(e) => saveHandFont(e.target.value)}
                className="font-hand bg-paper text-ink outline-none"
                style={{ fontSize: 16, border: '1.5px solid var(--ink-soft)', borderRadius: 8, padding: '6px 10px' }}
              >
                {HAND_FONTS.map((f) => (
                  <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
                ))}
              </select>
              <div>
                <Btn size="sm" onClick={() => setEditingHandFont(false)}>Cancelar</Btn>
              </div>
            </div>
          ) : (
            <SettingsRow
              icon="leaf"
              label="Fuente hand"
              detail={HAND_FONTS.find(f => f.value === handFont)?.label ?? 'Patrick Hand'}
              onTap={() => setEditingHandFont(true)}
              isLoading={isLoading}
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
            isLoading={isLoading}
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
            isLoading={isLoading}
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
