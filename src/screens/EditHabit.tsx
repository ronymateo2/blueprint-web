import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { api, type Habit } from '../api/client';
import { HabitForm, type HabitFormValues, type HabitType } from './HabitForm';
import { ConfirmSheet } from '../components/ConfirmSheet';
import { HABITS_KEY } from '../hooks/useHabits';

function apiTypeToDesign(t: Habit['type']): HabitType {
  if (t === 'time') return 'time';
  if (t === 'yn') return 'yn';
  return 'count';
}

export function EditHabit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [habit, setHabit] = useState<Habit | null>(null);
  const [confirmArchive, setConfirmArchive] = useState(false);

  useEffect(() => {
    if (!id) return;
    void api.habits.get(id).then(setHabit);
  }, [id]);

  async function save(values: HabitFormValues) {
    if (!id) return;
    await api.habits.update(id, {
      name: values.name, icon: values.icon,
      type: values.type === 'time' ? 'time' : values.type === 'yn' ? 'yn' : 'count',
      goal: values.goal, points: values.pts,
      frequency_type: values.frequency_type,
      frequency_config: values.frequency_config,
      start_date: values.start_date,
      end_date: values.end_date,
    });
    await queryClient.invalidateQueries({ queryKey: HABITS_KEY });
    navigate(-1);
  }

  async function archiveHabit() {
    if (!id || !habit) return;
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

  return (
    <>
    <HabitForm
      navTitle="Editar hábito"
      saveLabel="guardar"
      defaultValues={{
        name: habit.name,
        icon: habit.icon,
        type: apiTypeToDesign(habit.type),
        goal: habit.goal,
        pts: habit.points,
        frequency_type: habit.frequency_type ?? 'daily',
        frequency_config: habit.frequency_config ?? '{}',
        start_date: habit.start_date,
        end_date: habit.end_date,
      }}
      onSubmit={save}
      onCancel={() => navigate(-1)}
      bottomSlot={
        <button
          onClick={() => setConfirmArchive(true)}
          className="font-hand cursor-pointer"
          style={{
            padding: 12, textAlign: 'center', borderRadius: 999,
            border: '1.8px dashed var(--ink-soft)', color: 'var(--ink-soft)',
            fontSize: 15, background: 'transparent', width: '100%',
            marginTop: 8,
          }}
        >Archivar hábito</button>
      }
    />
    <ConfirmSheet
      open={confirmArchive}
      title={`¿Archivar «${habit.name}»?`}
      description="Podrás restaurarlo desde el archivo cuando quieras."
      confirmLabel="Archivar"
      onConfirm={() => { setConfirmArchive(false); void archiveHabit(); }}
      onCancel={() => setConfirmArchive(false)}
    />
    </>
  );
}
