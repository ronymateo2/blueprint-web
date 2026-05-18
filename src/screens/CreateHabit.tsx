import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { HabitForm, type HabitFormValues } from './HabitForm';

export function CreateHabit() {
  const navigate = useNavigate();

  async function save(values: HabitFormValues) {
    await api.habits.create({
      name: values.name, icon: values.icon,
      type: values.type === 'time' ? 'time' : values.type === 'yn' ? 'yn' : 'count',
      goal: values.goal, unit: null, points: values.pts, sort_order: 0,
    });
    navigate('/', { replace: true });
  }

  return (
    <HabitForm
      navTitle="Nuevo hábito"
      saveLabel="+ Crear hábito"
      autoFocusName
      onSubmit={save}
      onCancel={() => navigate(-1)}
    />
  );
}
