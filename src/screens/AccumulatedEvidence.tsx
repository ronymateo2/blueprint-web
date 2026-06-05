import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon, ArrowUUpLeftIcon, BatteryLowIcon, PlantIcon, TargetIcon } from '@phosphor-icons/react';
import { useHabits } from '../hooks/useHabits';
import { useEntries } from '../hooks/useEntries';
import { useAuthContext } from '../context/AuthContext';
import { useNavDirection } from '../context/NavContext';
import { todayLocalDate, localDayUtcRange, addDays } from '../lib/dateUtils';
import { buildPeriodEvidence, PERIOD_DAYS, PERIOD_LABELS, type Period } from '../lib/evidence';
import { SketchBox } from '../components/ui/SketchBox';
import { Btn } from '../components/ui/Btn';

const PERIODS: Period[] = ['week', 'month', '3m', 'year'];

function CountRow({ Icon, label, sub, value }: { Icon: typeof TargetIcon; label: string; sub: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Icon size={26} color="var(--ink)" style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="font-hand text-ink" style={{ fontSize: 16, lineHeight: 1.1 }}>{label}</div>
        <div className="font-hand text-ink-soft" style={{ fontSize: 13 }}>{sub}</div>
      </div>
      <span className="font-display" style={{ fontSize: 22, flexShrink: 0 }}>{value}</span>
    </div>
  );
}

export function AccumulatedEvidence() {
  const { habitId } = useParams();
  const navigate = useNavigate();
  const { setDirection } = useNavDirection();
  const { timezone } = useAuthContext();
  const { habits, loading: loadingHabits } = useHabits();
  const habit = habits.find((h) => h.id === habitId);

  const [period, setPeriod] = useState<Period>('week');

  const today = todayLocalDate(timezone);
  const range = useMemo(() => ({
    from: localDayUtcRange(addDays(today, -(PERIOD_DAYS.year - 1)), timezone).from,
    to: localDayUtcRange(today, timezone).to,
  }), [today, timezone]);
  const { entries, loading: loadingEntries } = useEntries({ habitId, from: range.from, to: range.to });

  const ev = useMemo(
    () => (habit ? buildPeriodEvidence(entries, habit, timezone, period) : null),
    [habit, entries, timezone, period],
  );

  function back() {
    setDirection('left');
    navigate(`/identity/${habitId}/evidencia/hoy`);
  }

  return (
    <div className="screen">
      <div style={{ padding: '14px 14px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Btn onClick={back} style={{ height: 36, padding: '0 14px', fontSize: 16 }}><ArrowLeftIcon size={16} /></Btn>
        <span className="font-display" style={{ fontSize: 22 }}>Evidencias acumuladas</span>
        <div style={{ width: 52 }} />
      </div>

      {loadingHabits || loadingEntries || !ev ? (
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

          <SketchBox padding={16} radius={16} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="font-hand text-ink-soft" style={{ fontSize: 13 }}>En este período demostraste:</div>
            <CountRow Icon={PlantIcon} label="No abandonaste" sub="Apareciste por ti" value={`${ev.daysShownUp}`} />
            <CountRow Icon={TargetIcon} label="Usaste versión mínima" sub="Elegiste seguir, incluso poco" value={`${ev.minActionDays}`} />
            <CountRow Icon={BatteryLowIcon} label="Apareciste en días difíciles" sub="Lo hiciste con baja energía" value={`${ev.hardDayWins}`} />
            <CountRow Icon={ArrowUUpLeftIcon} label="Volviste después de fallar" sub="No abandonas, regresas y ajustas" value={`${ev.returns}`} />
            <CountRow Icon={PlantIcon} label="Fuiste consistente" sub="Días alineados con tu identidad" value={`${Math.round(ev.consistency * 100)}%`} />
          </SketchBox>

          {/* Narrative */}
          <SketchBox accent padding={16} radius={18}>
            <div className="font-hand text-ink-soft" style={{ fontSize: 13, marginBottom: 6 }}>Tu historia</div>
            <div className="font-display" style={{ fontSize: 20, lineHeight: 1.2 }}>{ev.narrative}</div>
          </SketchBox>

          <Btn
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => { setDirection('right'); navigate(`/identity/${habitId}/progreso`); }}
          >
            Ver progreso de identidad
          </Btn>
        </div>
      )}
    </div>
  );
}
