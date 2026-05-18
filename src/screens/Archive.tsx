import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowCounterClockwise } from '@phosphor-icons/react';
import { api, type Habit } from '../api/client';
import { SketchBox } from '../components/SketchBox';
import { Btn } from '../components/Btn';
import { IconTile } from '../components/IconTile';
import { Scribble } from '../components/Scribble';

function daysAgo(isoDate: string): number {
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / 86400000);
}

export function Archive() {
  const navigate = useNavigate();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const all = await api.habits.list(true);
      setHabits(all.filter(h => !!h.archived_at));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function restore(h: Habit) {
    await api.habits.unarchive(h.id);
    await load();
  }

  async function deleteHabit(h: Habit) {
    if (!confirm(`¿Eliminar "${h.name}" y todos sus registros? No se puede deshacer.`)) return;
    await api.habits.delete(h.id);
    await load();
  }

  return (
    <div className="screen">
      {/* Header */}
      <div style={{ padding: '14px 18px 6px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Btn onClick={() => navigate(-1)} style={{ height: 36, padding: '0 14px', fontSize: 16 }}><ArrowLeft size={16} /> Yo</Btn>
        </div>
        <div className="font-display leading-none flex items-center" style={{ fontSize: 42, marginTop: 4 }}>
          Archivo <Scribble width={56} style={{ display: 'inline-block', verticalAlign: 'middle', marginLeft: 6, marginTop: -2 }} />
        </div>
        <div className="font-hand text-ink-soft" style={{ fontSize: 16, marginTop: 2 }}>
          {habits.length} hábito{habits.length === 1 ? '' : 's'} pausado{habits.length === 1 ? '' : 's'}
        </div>
      </div>

      <div className="screen-scroll flex flex-col gap-[10px]" style={{ padding: '4px 14px 20px' }}>
        {loading ? (
          <div className="font-hand text-ink-soft text-center" style={{ padding: 20 }}>Cargando…</div>
        ) : habits.length === 0 ? (
          <SketchBox dashed padding={20} style={{ textAlign: 'center', marginTop: 12 }}>
            <div className="font-display" style={{ fontSize: 22, marginBottom: 4 }}>Nada archivado</div>
            <div className="font-hand text-ink-soft" style={{ fontSize: 14 }}>
              cuando pauses un hábito aparecerá aquí, con todos sus registros intactos
            </div>
          </SketchBox>
        ) : (
          habits.map((h) => {
            const age = h.archived_at ? daysAgo(h.archived_at) : 0;
            return (
              <SketchBox
                key={h.id}
                padding={12}
                radius={14}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  background: 'rgba(255,255,255,0.4)',
                  opacity: 0.92,
                }}
              >
                <IconTile kind={h.icon} size={42} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="font-display text-ink-soft overflow-hidden text-ellipsis whitespace-nowrap" style={{ fontSize: 20, lineHeight: 1 }}>
                    {h.name}
                  </div>
                  <div className="font-hand text-ink-soft" style={{ fontSize: 12, marginTop: 2 }}>
                    {h.type === 'time' ? 'Duración' : h.type === 'yn' ? 'Marcar' : 'Contar'} · meta {h.goal}{h.type === 'time' ? ' min' : ''}
                  </div>
                  <div className="font-hand text-ink-soft" style={{ fontSize: 12, marginTop: 2 }}>
                    archivado {age === 0 ? 'hoy' : `hace ${age}d`}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <Btn variant="danger" size="xs" onClick={() => void restore(h)}><ArrowCounterClockwise size={14} /> Restaurar</Btn>
                    <Btn size="xs" onClick={() => void deleteHabit(h)}>borrar</Btn>
                  </div>
                </div>
              </SketchBox>
            );
          })
        )}
      </div>
    </div>
  );
}
