import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import Button from '../ui/Button';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  loading = false
}) => (
  <Modal
    open={open}
    onClose={onClose}
    size="sm"
    title={title}
    description={description}
    footer={(
      <>
        <Button type="button" variant="secondary" onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button type="button" variant="destructive" loading={loading} onClick={onConfirm} icon={<AlertTriangle size={14} />}>
          {confirmLabel}
        </Button>
      </>
    )}
  >
    <div className="flex items-start gap-3 rounded-card border border-danger/20 bg-danger/5 p-3.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-danger/20 bg-danger/10 text-danger">
        <AlertTriangle size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-fg">Confirm this action</p>
        <p className="mt-1 text-[11px] leading-5 text-muted">{description}</p>
      </div>
    </div>
  </Modal>
);

export default ConfirmDialog;
