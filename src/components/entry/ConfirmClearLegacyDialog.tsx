import { useEffect, useId, useRef } from 'react';
import { useI18n } from '../../i18n/I18nContext';

export function ConfirmClearLegacyDialog({
  isOpen,
  legacyCount,
  isClearing,
  onCancel,
  onConfirm,
}: {
  isOpen: boolean;
  legacyCount: number;
  isClearing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

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
        {t.dialogs.clearLegacyTitle}
      </h2>
      <p style={{ margin: '0 0 1.25rem', color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
        {t.dialogs.clearLegacyBody(legacyCount)}
      </p>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
        <button
          type="button"
          className="btn btn-secondary"
          autoFocus
          onClick={() => dialogRef.current?.close()}
        >
          {t.dialogs.keepCopy}
        </button>
        <button
          type="button"
          className="btn btn-primary"
          style={{ background: 'var(--expense-fg)' }}
          disabled={isClearing}
          onClick={onConfirm}
        >
          {isClearing ? t.dialogs.clearing : t.dialogs.clearOldCopy}
        </button>
      </div>
    </dialog>
  );
}
