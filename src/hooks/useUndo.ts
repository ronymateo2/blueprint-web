import { useCallback } from 'react';
import { toast } from 'sonner';

interface UndoItem {
  id: string;
  text: string;
  onUndo: () => Promise<void>;
}

export function useUndo() {
  const show = useCallback((item: UndoItem) => {
    toast(`Registrado · ${item.text}`, {
      id: item.id,
      duration: 4000,
      action: {
        label: 'Deshacer',
        onClick: item.onUndo,
      },
    });
  }, []);

  return { show };
}
