import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon, SparkleIcon } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { api, type FrictionCause } from '../api/client';
import { useHabits } from '../hooks/useHabits';
import { useEntries } from '../hooks/useEntries';
import { useAuthContext } from '../context/AuthContext';
import { useNavDirection } from '../context/NavContext';
import { todayLocalDate, localDayUtcRange, addDays } from '../lib/dateUtils';
import { dayEvidenceFor } from '../lib/evidence';
import { SketchBox } from '../components/ui/SketchBox';
import { Btn } from '../components/ui/Btn';
import { EvidenceList } from '../components/identity/EvidenceList';
import { FrictionPicker } from '../components/identity/FrictionPicker';
import { IconTile } from '../components/habits/IconTile';

export function TodayEvidence() {
  const { habitId } = useParams();
  const navigate = useNavigate();
  const { setDirection } = useNavDirection();
  const { timezone } = useAuthContext();
  const { habits, loading: loadingHabits } = useHabits();
  const habit = habits.find((h) => h.id === habitId);

  const today = todayLocalDate(timezone);
  const range = useMemo(() => ({
    from: localDayUtcRange(addDays(today, -14), timezone).from,
    to: localDayUtcRange(today, timezone).to,
  }), [today, timezone]);
  const { entries, loading: loadingEntries } = useEntries({ habitId, from: range.from, to: range.to });

  const evidence = useMemo(
    () => (habit ? dayEvidenceFor(entries, habit, timezone, today) : null),
    [habit, entries, timezone, today],
  );

  // Fricción de hoy (días sin registro)
  const [cause, setCause] = useState<FrictionCause | null>(null);
  const [frictionNote, setFrictionNote] = useState('');
  const [savingFriction, setSavingFriction] = useState(false);

  useEffect(() => {
    if (!habitId) return;
    let alive = true;
    api.friction.list(habitId, today, today)
      .then((rows) => {
        if (!alive || rows.length === 0) return;
        setCause(rows[0].cause);
        setFrictionNote(rows[0].note ?? '');
      })
      .catch(() => { /* sin fricción guardada */ });
    return () => { alive = false; };
  }, [habitId, today]);

  async function saveFriction() {
    if (!habitId || !cause) return;
    setSavingFriction(true);
    try {
      await api.friction.save({ habit_id: habitId, local_date: today, cause, note: frictionNote.trim() || null });
      toast('Aprendiste algo sobre tu fricción');
    } finally {
      setSavingFriction(false);
    }
  }

  function back() {
    setDirection('left');
    navigate(`/identity/${habitId}`);
  }

  const dateLabel = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'long' }).format(
    new Date(localDayUtcRange(today, timezone).from),
  );

  return (
    <div className="screen">
      <div style={{ padding: '14px 14px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Btn onClick={back} style={{ height: 36, padding: '0 14px', fontSize: 16 }}><ArrowLeftIcon size={16} /></Btn>
        <span className="font-display" style={{ fontSize: 22 }}>Evidencia de hoy</span>
        <div style={{ width: 52 }} />
      </div>

      {loadingHabits || loadingEntries || !evidence ? (
        <div className="screen-scroll flex items-center justify-center font-hand text-ink-soft" style={{ fontSize: 15 }}>
          {!habit && !loadingHabits ? 'Hábito no encontrado' : 'Cargando…'}
        </div>
      ) : (
        <div className="screen-scroll flex flex-col gap-[14px]" style={{ padding: '8px 14px 24px' }}>
          {/* Habit */}
          <SketchBox padding={14} radius={16} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <IconTile kind={habit!.icon} size={44} />
            <div style={{ minWidth: 0 }}>
              <div className="font-display" style={{ fontSize: 20, lineHeight: 1 }}>{habit!.name}</div>
              <div className="font-hand text-ink-soft" style={{ fontSize: 13, marginTop: 3 }}>Hoy, {dateLabel}</div>
            </div>
          </SketchBox>

          {/* Proof of day */}
          <SketchBox accent padding={18} radius={18}>
            <div className="font-hand text-ink-soft" style={{ fontSize: 13, marginBottom: 8 }}>
              {evidence.acted ? 'Hoy demostraste que:' : 'Recuerda esto:'}
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <SparkleIcon size={28} weight="fill" color="var(--coral)" style={{ flexShrink: 0, marginTop: 2 }} />
              <div className="font-display" style={{ fontSize: 24, lineHeight: 1.1 }}>{evidence.proofOfDay}</div>
            </div>
          </SketchBox>

          {/* Proofs */}
          <SketchBox padding={16} radius={16}>
            <div className="font-hand text-ink-soft" style={{ fontSize: 13, marginBottom: 10 }}>
              {evidence.acted ? 'Pruebas de hoy' : 'Para hoy'}
            </div>
            <EvidenceList statements={evidence.acted ? evidence.statements.slice(0, 3) : evidence.statements} />
          </SketchBox>

          {evidence.acted ? (
            <>
              <Btn
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => { setDirection('right'); navigate(`/identity/${habitId}/evidencia/acumulada`); }}
              >
                Ver evidencias acumuladas
              </Btn>
              <Btn
                variant="outline"
                size="md"
                fullWidth
                onClick={() => { setDirection('right'); navigate(`/identity/${habitId}/progreso`); }}
              >
                Progreso de identidad
              </Btn>
            </>
          ) : (
            <>
              {/* Friction capture */}
              <SketchBox padding={16} radius={16}>
                <div className="font-hand" style={{ fontSize: 16, lineHeight: 1.2 }}>¿Qué se interpuso hoy?</div>
                <div className="font-hand text-ink-soft" style={{ fontSize: 13, marginTop: 4, marginBottom: 12 }}>
                  Conocer tu fricción es entrenar el retorno.
                </div>
                <FrictionPicker cause={cause} onCause={setCause} note={frictionNote} onNote={setFrictionNote} />
                <Btn
                  variant="outline"
                  size="md"
                  fullWidth
                  disabled={!cause}
                  loading={savingFriction}
                  onClick={() => void saveFriction()}
                  style={{ marginTop: 12 }}
                >
                  Guardar aprendizaje
                </Btn>
              </SketchBox>

              <Btn
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => { setDirection('right'); navigate(`/identity/${habitId}/registrar`); }}
              >
                Puedo volver ahora
              </Btn>
              <Btn
                variant="outline"
                size="md"
                fullWidth
                onClick={() => { setDirection('right'); navigate(`/identity/${habitId}/progreso`); }}
              >
                Progreso de identidad
              </Btn>
            </>
          )}
        </div>
      )}
    </div>
  );
}
