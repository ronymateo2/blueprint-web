import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, type Habit } from '../api/client';
import { HabitForm, type HabitFormValues, type HabitType } from './HabitForm';

function apiTypeToDesign(t: Habit['type']): HabitType {
  if (t === 'time') return 'time';
  if (t === 'yn') return 'yn';
  return 'count';
}

export function EditHabit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [habit, setHabit] = useState<Habit | null>(null);

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
    });
    navigate(-1);
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

  return (
    <HabitForm
      navTitle="Editar hábito"
      saveLabel="guardar"
      defaultValues={{
        name: habit.name,
        icon: habit.icon,
        type: apiTypeToDesign(habit.type),
        goal: habit.goal,
        pts: habit.points,
      }}
      onSubmit={save}
      onCancel={() => navigate(-1)}
      bottomSlot={
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
      }
    />
  );
}
