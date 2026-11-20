import { AlertCircle, CheckCircle2, FileSpreadsheet, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import type {
  CsvImportPreview,
  CsvImportResult,
  DuplicateStrategy,
} from '../../domain/csvImport';

const PREVIEW_ROW_LIMIT = 50;

export function ImportCsvDialog({
  isOpen,
  fileName,
  preview,
  result,
  error,
  isImporting,
  onClose,
  onConfirmImport,
}: {
  isOpen: boolean;
  fileName: string | null;
  preview: CsvImportPreview | null;
  result: CsvImportResult | null;
  error: string | null;
  isImporting: boolean;
  onClose: () => void;
  onConfirmImport: (strategy: DuplicateStrategy) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [strategy, setStrategy] = useState<DuplicateStrategy>('skip');

  useEffect(() => {
    if (isOpen) {
      setStrategy('skip');
    }
  }, [isOpen, fileName]);

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
      onClose();
    };
    dialog.addEventListener('close', handleClose);

    // Light-dismiss fallback for Safari lacking closedBy support
    let cleanupBackdrop: (() => void) | undefined;
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      let pressedOutside = false;
      const isOutside = (e: PointerEvent) => {
        const r = dialog.getBoundingClientRect();
        return (
          e.clientX < r.left ||
          e.clientX > r.right ||
          e.clientY < r.top ||
          e.clientY > r.bottom
        );
      };
      const onPointerDown = (e: PointerEvent) => {
        pressedOutside = isOutside(e);
      };
      const onPointerUp = (e: PointerEvent) => {
        if (pressedOutside && isOutside(e)) {
          dialog.close();
        }
      };
      dialog.addEventListener('pointerdown', onPointerDown);
      dialog.addEventListener('pointerup', onPointerUp);
      cleanupBackdrop = () => {
        dialog.removeEventListener('pointerdown', onPointerDown);
        dialog.removeEventListener('pointerup', onPointerUp);
      };
    }

    return () => {
      dialog.removeEventListener('close', handleClose);
      cleanupBackdrop?.();
    };
  }, [onClose]);

  const invalidRows = preview?.rows.filter((r) => r.status === 'invalid') ?? [];
  const importableCount = preview
    ? strategy === 'skip'
      ? preview.newRows
      : preview.validRows
    : 0;

  return (
    <dialog
      ref={dialogRef}
      className="import-dialog"
      aria-labelledby={titleId}
      {...({ closedby: 'any' } as Record<string, unknown>)}
    >
      <div className="dialog-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <FileSpreadsheet size={22} color="#0D47A1" aria-hidden="true" />
          <div>
            <h2 id={titleId} className="card-title">
              CSV စာရင်းသွင်းရန် · Import CSV
            </h2>
            <p className="card-caption">{fileName ?? 'Review rows before saving to database'}</p>
          </div>
        </div>
        <button
          type="button"
          className="btn-ghost"
          aria-label="Close CSV import dialog"
          onClick={() => dialogRef.current?.close()}
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>

      <div className="dialog-body">
        {error && (
          <div
            role="alert"
            style={{
              padding: '0.85rem 1rem',
              borderRadius: '12px',
              background: 'var(--expense-bg)',
              color: 'var(--expense-fg)',
              marginBottom: '1rem',
              fontSize: '0.9rem',
            }}
          >
            {error}
          </div>
        )}

        {result ? (
          <div
            style={{
              padding: '1.25rem',
              borderRadius: '16px',
              background: 'var(--surface-tint)',
              border: '1px solid var(--blue-sky)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.85rem' }}>
              <CheckCircle2 size={22} color="var(--income-fg)" aria-hidden="true" />
              <h3 className="card-title">CSV Import ပြီးစီးပါပြီ · Import Summary</h3>
            </div>

            <div className="import-stats-grid">
              <div className="import-stat-box">
                <span>Imported (New)</span>
                <strong className="tabular-nums">{result.insertedCount}</strong>
              </div>
              <div className="import-stat-box">
                <span>Updated</span>
                <strong className="tabular-nums">{result.updatedCount}</strong>
              </div>
              <div className="import-stat-box">
                <span>Skipped Duplicates</span>
                <strong className="tabular-nums">{result.skippedCount}</strong>
              </div>
              <div className="import-stat-box">
                <span>Invalid Rows Ignored</span>
                <strong className="tabular-nums">{result.invalidCount}</strong>
              </div>
            </div>

            {result.createdCategoriesCount > 0 && (
              <p style={{ margin: '0.75rem 0 0', fontSize: '0.85rem', color: 'var(--blue-deep)' }}>
                Created {result.createdCategoriesCount} new custom category(ies) from CSV.
              </p>
            )}
          </div>
        ) : preview ? (
          <>
            {preview.headerError ? (
              <div
                role="alert"
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.6rem',
                  padding: '0.9rem 1rem',
                  borderRadius: '12px',
                  background: 'var(--expense-bg)',
                  color: 'var(--expense-fg)',
                  marginBottom: '1rem',
                  fontSize: '0.9rem',
                }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" />
                <span>{preview.headerError}</span>
              </div>
            ) : (
              <>
                <div className="import-stats-grid">
                  <div className="import-stat-box">
                    <span>Total Rows</span>
                    <strong className="tabular-nums">{preview.totalRows}</strong>
                  </div>
                  <div className="import-stat-box">
                    <span>Valid Rows</span>
                    <strong className="tabular-nums" style={{ color: 'var(--income-fg)' }}>
                      {preview.validRows}
                    </strong>
                  </div>
                  <div className="import-stat-box">
                    <span>Duplicate Rows</span>
                    <strong className="tabular-nums" style={{ color: 'var(--blue-deep)' }}>
                      {preview.duplicateRows}
                    </strong>
                  </div>
                  <div className="import-stat-box">
                    <span>Invalid Rows</span>
                    <strong
                      className="tabular-nums"
                      style={{ color: preview.invalidRows > 0 ? 'var(--expense-fg)' : 'var(--text-primary)' }}
                    >
                      {preview.invalidRows}
                    </strong>
                  </div>
                </div>

                {preview.duplicateRows > 0 && (
                  <fieldset
                    style={{
                      border: '1px solid var(--blue-sky)',
                      borderRadius: '14px',
                      padding: '0.9rem 1rem',
                      marginBottom: '1rem',
                      background: 'var(--surface-canvas)',
                    }}
                  >
                    <legend className="form-label" style={{ padding: '0 0.35rem' }}>
                      တူညီနေသော စာရင်းများ ကိုင်တွယ်ပုံ · Duplicate Handling ({preview.duplicateRows})
                    </legend>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="duplicate-strategy"
                          value="skip"
                          checked={strategy === 'skip'}
                          onChange={() => setStrategy('skip')}
                        />
                        <span>
                          <strong>Skip duplicates</strong> (ကျော်သွားမည် — existing records will not change)
                        </span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="duplicate-strategy"
                          value="update"
                          checked={strategy === 'update'}
                          onChange={() => setStrategy('update')}
                        />
                        <span>
                          <strong>Update existing records</strong> (ရှိပြီးသား စာရင်းများကို ပြင်ဆင်မည်)
                        </span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="duplicate-strategy"
                          value="import_as_new"
                          checked={strategy === 'import_as_new'}
                          onChange={() => setStrategy('import_as_new')}
                        />
                        <span>
                          <strong>Import as new records</strong> (ID အသစ်ဖြင့် စာရင်းသစ်ထည့်မည်)
                        </span>
                      </label>
                    </div>
                  </fieldset>
                )}

                {invalidRows.length > 0 && (
                  <div className="import-errors-list" role="region" aria-label="Validation errors">
                    <strong style={{ display: 'block', marginBottom: '0.35rem' }}>
                      Validation Errors ({invalidRows.length} invalid row{invalidRows.length > 1 ? 's' : ''} will be skipped):
                    </strong>
                    <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.84rem' }}>
                      {invalidRows.slice(0, 20).map((row) => (
                        <li key={row.rowNumber}>
                          <strong>Row {row.rowNumber}:</strong> {row.errors.join(' ')}
                        </li>
                      ))}
                      {invalidRows.length > 20 && (
                        <li>...and {invalidRows.length - 20} more invalid rows.</li>
                      )}
                    </ul>
                  </div>
                )}

                <div className="table-wrapper" style={{ maxBlockSize: '260px', marginBottom: '0.75rem' }}>
                  <table className="ledger-table import-preview-table">
                    <thead>
                      <tr>
                        <th scope="col">Row</th>
                        <th scope="col">Status</th>
                        <th scope="col">Date</th>
                        <th scope="col">Type</th>
                        <th scope="col">Category</th>
                        <th scope="col" style={{ textAlign: 'right' }}>Amount</th>
                        <th scope="col">Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.rows.slice(0, PREVIEW_ROW_LIMIT).map((row) => (
                        <tr key={row.rowNumber}>
                          <td className="tabular-nums">{row.rowNumber}</td>
                          <td>
                            <span className={`import-status-pill import-status-pill--${row.status}`}>
                              {row.status === 'new'
                                ? 'New'
                                : row.status === 'duplicate'
                                  ? 'Duplicate'
                                  : 'Invalid'}
                            </span>
                          </td>
                          <td className="tabular-nums">{row.rawSummary.date}</td>
                          <td>{row.rawSummary.type}</td>
                          <td>{row.rawSummary.category}</td>
                          <td className="amount-cell tabular-nums">{row.rawSummary.amount}</td>
                          <td style={{ whiteSpace: 'pre-wrap' }}>
                            {row.rawSummary.note}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {preview.rows.length > PREVIEW_ROW_LIMIT && (
                  <p className="card-caption" style={{ marginBottom: '0.5rem' }}>
                    Showing first {PREVIEW_ROW_LIMIT} of {preview.rows.length} rows in preview. All {importableCount} valid rows will be imported atomically.
                  </p>
                )}
              </>
            )}
          </>
        ) : null}
      </div>

      <div className="dialog-footer">
        {result ? (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => dialogRef.current?.close()}
          >
            Done
          </button>
        ) : preview ? (
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => dialogRef.current?.close()}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={isImporting || Boolean(preview.headerError) || importableCount === 0}
              onClick={() => onConfirmImport(strategy)}
            >
              {isImporting
                ? 'Importing...'
                : `Import ${importableCount} Row${importableCount === 1 ? '' : 's'}`}
            </button>
          </>
        ) : (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => dialogRef.current?.close()}
          >
            Close
          </button>
        )}
      </div>
    </dialog>
  );
}
