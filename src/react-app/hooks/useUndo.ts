import { useState, useCallback } from 'react';

interface UndoItem {
  id: string;
  text: string;
  onUndo: () => Promise<void>;
}

export function useUndo() {
  const [toast, setToast] = useState<UndoItem | null>(null);

  const show = useCallback((item: UndoItem) => {
    setToast(item);
  }, []);

  const dismiss = useCallback(() => setToast(null), []);

  const handleUndo = useCallback(async () => {
    if (!toast) return;
    await toast.onUndo();
    setToast(null);
  }, [toast]);

  return { toast, show, dismiss, handleUndo };
}
