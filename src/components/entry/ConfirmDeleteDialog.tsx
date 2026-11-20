import { useEffect, useId, useRef } from 'react';
import type { Transaction } from '../../types/ledger';
import { formatCurrency, type CurrencyCode } from '../../utils/formatters';

export function ConfirmDeleteDialog({
  target,
  currency,
  isDeleting,
  onCancel,
  onConfirm,
}: {
  target: Transaction | null;
  currency: CurrencyCode;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: (id: number) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (target && !dialog.open) {
      dialog.showModal();
    } else if (!target && dialog.open) {
      dialog.close();
    }
  }, [target]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => {
      dialog.returnValue = '';
      onCancel();
    };
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onCancel]);

  return (
    <dialog ref={dialogRef} className="confirm-dialog" aria-labelledby={titleId}>
      <h2 id={titleId} className="card-title" style={{ marginBottom: '0.5rem' }}>
        စာရင်းဖျက်မည်လား · Delete Entry?
      </h2>
      {target && (
        <p style={{ margin: '0 0 1.25rem', color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
          This will permanently remove{' '}
          <strong style={{ color: 'var(--text-primary)' }}>
            {target.category.nameMy ?? target.category.name} ({formatCurrency(target.amount, currency)})
          </strong>{' '}
          from your ledger.
        </p>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
        <button
          type="button"
          className="btn btn-secondary"
          autoFocus
          onClick={() => dialogRef.current?.close()}
        >
          Keep Entry
        </button>
        <button
          type="button"
          className="btn btn-primary"
          style={{ background: 'var(--expense-fg)' }}
          disabled={isDeleting || !target}
          onClick={() => target && onConfirm(target.id)}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </dialog>
  );
}
