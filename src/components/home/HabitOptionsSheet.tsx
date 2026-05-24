import { useNavigate } from 'react-router-dom';
import {
  PencilSimpleIcon,
  ClockIcon,
  ChartBarIcon,
  CheckIcon,
  ArrowRightIcon,
  LeafIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import { type Habit } from '../../api/client';
import { BottomSheet } from '../ui/BottomSheet';

interface HabitOptionsSheetProps {
  habit: Habit | null;
  isSkipped: boolean;
  onClose: () => void;
  onSkip: () => void;
  onUnskip: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

export function HabitOptionsSheet({
  habit,
  isSkipped,
  onClose,
  onSkip,
  onUnskip,
  onArchive,
  onDelete,
}: HabitOptionsSheetProps) {
  const navigate = useNavigate();

  return (
    <BottomSheet open={!!habit} onClose={onClose}>
      {habit && (
        <>
          <div className="font-display" style={{ fontSize: 22, marginBottom: 2 }}>
            {habit.name}
          </div>
          <div className="font-hand text-ink-soft" style={{ fontSize: 13, marginBottom: 16 }}>
            opciones del hábito
          </div>
          {([
            {
              icon: <PencilSimpleIcon size={18} />,
              label: 'Editar hábito',
              color: 'var(--ink)',
              action: () => {
                onClose();
                navigate(`/habits/${habit.id}/edit`);
              },
            },
            {
              icon: <ClockIcon size={18} />,
              label: 'Ver historial completo',
              color: 'var(--ink)',
              action: () => {
                onClose();
                navigate(`/habits/${habit.id}/history`);
              },
            },
            {
              icon: <ChartBarIcon size={18} />,
              label: 'Ver estadísticas',
              color: 'var(--ink)',
              action: () => {
                onClose();
                navigate(`/habits/${habit.id}/statistics`);
              },
            },
            isSkipped
              ? {
                  icon: <CheckIcon size={18} />,
                  label: 'Quitar del skip',
                  color: 'var(--ink)',
                  action: onUnskip,
                }
              : {
                  icon: <ArrowRightIcon size={18} />,
                  label: 'Saltear hoy',
                  color: 'var(--ink)',
                  action: onSkip,
                },
            {
              icon: <LeafIcon size={18} />,
              label: 'Archivar hábito',
              color: 'var(--ink)',
              action: onArchive,
            },
            {
              icon: <TrashIcon size={18} />,
              label: 'Eliminar permanente',
              color: 'var(--coral)',
              action: onDelete,
            },
          ]).map(({ icon, label, color, action }) => (
            <button
              key={label}
              onClick={action}
              className="font-hand"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                padding: '13px 0',
                background: 'none',
                border: 'none',
                borderBottom: '1px dashed var(--ink-soft)',
                cursor: 'pointer',
                fontSize: 17,
                color,
                textAlign: 'left',
              }}
            >
              {icon}
              {label}
            </button>
          ))}
        </>
      )}
    </BottomSheet>
  );
}
