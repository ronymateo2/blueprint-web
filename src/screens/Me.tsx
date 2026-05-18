import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../api/client';
import { SketchBox } from '../components/SketchBox';
import { SketchButton } from '../components/SketchButton';

const TIMEZONES = [
  'UTC', 'America/Santo_Domingo', 'America/New_York', 'America/Chicago',
  'America/Denver', 'America/Los_Angeles', 'America/Mexico_City', 'America/Bogota',
  'America/Lima', 'America/Santiago', 'America/Buenos_Aires', 'Europe/Madrid',
];

export function Me() {
  const { user, logout, reload } = useAuth();
  const navigate = useNavigate();
  const [editingTz, setEditingTz] = useState(false);
  const [tz, setTz] = useState(user?.timezone ?? 'UTC');
  const [saving, setSaving] = useState(false);

  async function saveTz() {
    setSaving(true);
    await api.auth.patchMe({ timezone: tz });
    await reload();
    setSaving(false);
    setEditingTz(false);
  }

  return (
    <div className="screen">
      <div style={{ padding: '16px 18px 0' }}>
        <div className="font-display" style={{ fontSize: 34 }}>Yo</div>
      </div>

      <div className="screen-scroll flex flex-col gap-[12px]" style={{ padding: '16px 14px' }}>

        {/* Profile card */}
        <SketchBox padding={14} className="flex items-center gap-[12px]">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="" className="border-ink" style={{ width: 52, height: 52, borderRadius: 26, border: '1.6px solid var(--ink)' }} />
          ) : (
            <div className="flex items-center justify-center font-display bg-coral-soft border-ink" style={{ width: 52, height: 52, borderRadius: 26, border: '1.6px solid var(--ink)', fontSize: 24 }}>
              {user?.display_name?.[0]?.toUpperCase() ?? '?'}
            </div>
          )}
          <div>
            <div className="font-display leading-none" style={{ fontSize: 22 }}>{user?.display_name ?? 'Usuario'}</div>
            <div className="font-hand text-ink-soft" style={{ fontSize: 15, marginTop: 2 }}>{user?.email}</div>
          </div>
        </SketchBox>

        {/* Timezone */}
        <SketchBox padding={12}>
          <div className="font-hand text-ink-soft" style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Zona horaria</div>
          {editingTz ? (
            <div className="flex flex-col gap-[8px]">
              <select
                value={tz}
                onChange={(e) => setTz(e.target.value)}
                className="font-hand bg-paper text-ink outline-none"
                style={{ fontSize: 16, border: '1px solid var(--ink-soft)', borderRadius: 8, padding: '6px 10px' }}
              >
                {TIMEZONES.map((z) => <option key={z} value={z}>{z}</option>)}
              </select>
              <div className="flex gap-[8px]">
                <SketchButton small accent filled onClick={() => void saveTz()} disabled={saving}>{saving ? '…' : 'Guardar'}</SketchButton>
                <SketchButton small onClick={() => setEditingTz(false)}>Cancelar</SketchButton>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="font-hand" style={{ fontSize: 17 }}>{user?.timezone ?? 'UTC'}</span>
              <SketchButton small onClick={() => setEditingTz(true)}>Cambiar</SketchButton>
            </div>
          )}
        </SketchBox>

        {/* Archived habits */}
        <SketchButton style={{ justifyContent: 'center' }} onClick={() => navigate('/habits/archived')}>
          Ver hábitos archivados
        </SketchButton>

        {/* Logout */}
        <SketchButton
          style={{ justifyContent: 'center', borderColor: '#a03a2a', color: '#a03a2a' }}
          onClick={() => { logout(); navigate('/login', { replace: true }); }}
        >
          Cerrar sesión
        </SketchButton>
      </div>

    </div>
  );
}
