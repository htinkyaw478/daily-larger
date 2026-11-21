import { useEffect, useId, useRef } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { getCategoryLabel } from '../../i18n/translations';
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
  const { language, t } = useI18n();
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

  const targetLabel = target ? getCategoryLabel(target.category, language) : '';

  return (
    <dialog ref={dialogRef} className="confirm-dialog" aria-labelledby={titleId}>
      <h2 id={titleId} className="card-title" style={{ marginBottom: '0.5rem' }}>
        {t.dialogs.deleteTitle}
      </h2>
      {target && (
        <p style={{ margin: '0 0 1.25rem', color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
          {t.dialogs.deleteBody(targetLabel, formatCurrency(target.amount, currency))}
        </p>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
        <button
          type="button"
          className="btn btn-secondary"
          autoFocus
          onClick={() => dialogRef.current?.close()}
        >
          {t.dialogs.keepEntry}
        </button>
        <button
          type="button"
          className="btn btn-primary"
          style={{ background: 'var(--expense-fg)' }}
          disabled={isDeleting || !target}
          onClick={() => target && onConfirm(target.id)}
        >
          {isDeleting ? t.dialogs.deleting : t.dialogs.deleteConfirm}
        </button>
      </div>
    </dialog>
  );
}
