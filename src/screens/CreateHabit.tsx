import { useNavigate } from 'react-router-dom';
import { Plus } from '@phosphor-icons/react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { HabitForm, type HabitFormValues } from '../components/habits/HabitForm';
import { HABITS_KEY } from '../hooks/useHabits';

export function CreateHabit() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function save(values: HabitFormValues) {
    const habit = await api.habits.create({
      name: values.name, icon: values.icon,
      type: values.type === 'time' ? 'time' : values.type === 'yn' ? 'yn' : 'count',
      goal: values.goal, unit: null, points: values.pts, sort_order: 0,
      frequency_type: values.frequency_type,
      frequency_config: values.frequency_config,
      start_date: values.start_date,
      end_date: values.end_date,
    });
    if (values.reminders && values.reminders.length > 0) {
      await Promise.all(values.reminders.map(r =>
        api.reminders.create(habit.id, { time: r.time, days: JSON.stringify(r.days), enabled: r.enabled ? 1 : 0 })
      ));
    }
    await queryClient.invalidateQueries({ queryKey: HABITS_KEY });
    navigate('/', { replace: true });
  }

  return (
    <HabitForm
      navTitle="Nuevo hábito"
      saveLabel={<><Plus size={14} /> Crear hábito</>}
      autoFocusName
      onSubmit={save}
      onCancel={() => navigate(-1)}
    />
  );
}
