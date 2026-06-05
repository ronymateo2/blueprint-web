import { CaretRight } from '@phosphor-icons/react';
import type { Habit } from '../../api/client';
import { SketchBox } from '../ui/SketchBox';
import { IconTile } from '../habits/IconTile';

interface IdentityCardProps {
  habit: Habit;
  onClick: () => void;
}

export function IdentityCard({ habit, onClick }: IdentityCardProps) {
  return (
    <SketchBox
      padding={14}
      radius={16}
      onClick={onClick}
      className="cursor-pointer"
      style={{ display: 'flex', alignItems: 'center', gap: 14 }}
    >
      <IconTile kind={habit.icon} size={48} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="font-display" style={{ fontSize: 22, lineHeight: 1 }}>{habit.name}</div>
        <div className="font-hand" style={{ fontSize: 15, marginTop: 4 }}>{habit.identity}</div>
        {habit.min_action && (
          <div className="font-hand text-ink-soft" style={{ fontSize: 13, marginTop: 2 }}>
            Mínimo: {habit.min_action}
          </div>
        )}
      </div>
      <CaretRight size={18} className="text-ink-soft" style={{ flexShrink: 0 }} />
    </SketchBox>
  );
}
