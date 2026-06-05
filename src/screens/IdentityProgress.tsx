import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from '@phosphor-icons/react';
import { useHabits } from '../hooks/useHabits';
import { useEntries } from '../hooks/useEntries';
import { useAuthContext } from '../context/AuthContext';
import { useNavDirection } from '../context/NavContext';
import { todayLocalDate, localDayUtcRange, addDays } from '../lib/dateUtils';
import { buildIdentityProgress, PERIOD_DAYS, PERIOD_LABELS, type Period } from '../lib/evidence';
import { SketchBox } from '../components/ui/SketchBox';
import { Btn } from '../components/ui/Btn';
import { Ring } from '../components/ui/Ring';
import { TraitBar } from '../components/identity/TraitBar';

const PERIODS: Period[] = ['week', 'month', '3m', 'year'];

export function IdentityProgress() {
  const { habitId } = useParams();
  const navigate = useNavigate();
  const { setDirection } = useNavDirection();
  const { timezone, user } = useAuthContext();
  const { habits, loading: loadingHabits } = useHabits();
  const habit = habits.find((h) => h.id === habitId);

  const [period, setPeriod] = useState<Period>('week');

  const today = todayLocalDate(timezone);
  // Necesita período actual + previo para los deltas.
  const range = useMemo(() => ({
    from: localDayUtcRange(addDays(today, -(2 * PERIOD_DAYS[period] - 1)), timezone).from,
    to: localDayUtcRange(today, timezone).to,
  }), [today, timezone, period]);
  const { entries, loading: loadingEntries } = useEntries({ habitId, from: range.from, to: range.to });

  const prog = useMemo(
    () => (habit ? buildIdentityProgress(entries, habit, timezone, period) : null),
    [habit, entries, timezone, period],
  );

  function back() {
    setDirection('left');
    navigate(`/identity/${habitId}`);
  }

  return (
    <div className="screen">
      <div style={{ padding: '14px 14px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Btn onClick={back} style={{ height: 36, padding: '0 14px', fontSize: 16 }}><ArrowLeftIcon size={16} /></Btn>
        <span className="font-display" style={{ fontSize: 22 }}>Progreso de identidad</span>
        <div style={{ width: 52 }} />
      </div>

      {loadingHabits || loadingEntries || !prog ? (
        <div className="screen-scroll flex items-center justify-center font-hand text-ink-soft" style={{ fontSize: 15 }}>
          {!habit && !loadingHabits ? 'Hábito no encontrado' : 'Cargando…'}
        </div>
      ) : (
        <div className="screen-scroll flex flex-col gap-[14px]" style={{ padding: '8px 14px 24px' }}>
          {/* Period tabs */}
          <div style={{ display: 'flex', gap: 6 }}>
            {PERIODS.map((p) => (
              <Btn key={p} variant="segment" size="sm" active={p === period} onClick={() => setPeriod(p)} style={{ flex: 1, padding: '6px 4px' }}>
                {PERIOD_LABELS[p]}
              </Btn>
            ))}
          </div>

          {/* Strength ring */}
          <SketchBox accent padding={18} radius={18} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div className="font-display" style={{ fontSize: 22, lineHeight: 1 }}>Tu identidad está creciendo</div>
            <Ring
              size={150}
              stroke={12}
              value={prog.strength / 100}
              color="var(--coral)"
              label={`${prog.strength}%`}
              labelSize={40}
            />
            <div className="font-hand text-ink-soft text-center" style={{ fontSize: 14 }}>alineado con tu identidad base</div>
          </SketchBox>

          {/* Identity base */}
          <SketchBox padding={16} radius={16}>
            <div className="font-hand text-ink-soft" style={{ fontSize: 13, marginBottom: 6 }}>Tu identidad base</div>
            <div className="font-display" style={{ fontSize: 22, lineHeight: 1.1 }}>
              {habit!.identity || user?.identity || 'Define tu identidad'}
            </div>
          </SketchBox>

          {/* Changes */}
          <SketchBox padding={16} radius={16} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="font-hand text-ink-soft" style={{ fontSize: 13 }}>Cambios en ti</div>
            <TraitBar label="Más resiliente" score={prog.traits.resiliente.score} delta={prog.traits.resiliente.delta} />
            <TraitBar label="Más disciplinado" score={prog.traits.disciplinado.score} delta={prog.traits.disciplinado.delta} />
            <TraitBar label="Más constante" score={prog.traits.constante.score} delta={prog.traits.constante.delta} />
          </SketchBox>

          <SketchBox accent padding={16} radius={16}>
            <div className="font-hand text-ink" style={{ fontSize: 15, lineHeight: 1.3 }}>
              Cada evidencia te acerca más a la persona que eliges ser.
            </div>
          </SketchBox>
        </div>
      )}
    </div>
  );
}
