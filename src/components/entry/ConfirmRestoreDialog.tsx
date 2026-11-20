import { useEffect, useId, useRef } from 'react';

export function ConfirmRestoreDialog({
  fileName,
  existingCount,
  isRestoring,
  onCancel,
  onConfirm,
}: {
  fileName: string | null;
  existingCount: number;
  isRestoring: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (fileName && !dialog.open) {
      dialog.showModal();
    } else if (!fileName && dialog.open) {
      dialog.close();
    }
  }, [fileName]);

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
        Backup ပြန်သွင်းမည်လား · Restore Backup?
      </h2>
      {fileName && (
        <p style={{ margin: '0 0 1.25rem', color: 'var(--text-muted)', fontSize: '0.9375rem' }}>
          Restoring <strong style={{ color: 'var(--text-primary)' }}>{fileName}</strong> will replace
          {existingCount > 0 ? ` your current ${existingCount} local entries` : ' your local ledger data'}.
          Consider downloading a backup first if you want to keep existing entries.
        </p>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
        <button
          type="button"
          className="btn btn-secondary"
          autoFocus
          onClick={() => dialogRef.current?.close()}
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={isRestoring || !fileName}
          onClick={onConfirm}
        >
          {isRestoring ? 'Restoring...' : 'Restore Backup'}
        </button>
      </div>
    </dialog>
  );
}
