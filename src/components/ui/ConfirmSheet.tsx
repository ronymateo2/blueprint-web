import { BottomSheet } from './BottomSheet';
import { Btn } from './Btn';

interface ConfirmSheetProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmSheet({ open, title, description, confirmLabel = 'Eliminar', onConfirm, onCancel }: ConfirmSheetProps) {
  return (
    <BottomSheet open={open} onClose={onCancel}>
      <div className="font-display" style={{ fontSize: 22, marginBottom: description ? 6 : 20 }}>{title}</div>
      {description && (
        <div className="font-hand text-ink-soft" style={{ fontSize: 15, marginBottom: 20 }}>{description}</div>
      )}
      <div style={{ display: 'flex', gap: 10 }}>
        <Btn variant="outline" className="flex-1" style={{ padding: '14px 0' }} onClick={onCancel}>Cancelar</Btn>
        <Btn variant="danger" className="flex-1" style={{ padding: '14px 0' }} onClick={onConfirm}>{confirmLabel}</Btn>
      </div>
    </BottomSheet>
  );
}
