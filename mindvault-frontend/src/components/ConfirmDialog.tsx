interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in px-4">
      <div className="w-full max-w-sm rounded-2xl bg-paper dark:bg-night-raised border border-ink/10 dark:border-mist/10 shadow-soft dark:shadow-soft-dark p-6 animate-rise">
        <h3 className="font-display text-lg text-ink dark:text-mist">{title}</h3>
        <p className="mt-2 text-sm text-ink-soft dark:text-mist-soft leading-relaxed">{description}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-ink-soft dark:text-mist-soft hover:bg-ink/5 dark:hover:bg-mist/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
              danger ? 'bg-rust-500 hover:bg-rust-400' : 'bg-moss-600 hover:bg-moss-500'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
