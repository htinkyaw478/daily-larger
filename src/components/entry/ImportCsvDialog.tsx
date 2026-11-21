import { AlertCircle, CheckCircle2, FileSpreadsheet, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import type {
  CsvImportPreview,
  CsvImportResult,
  DuplicateStrategy,
} from '../../domain/csvImport';
import { useI18n } from '../../i18n/I18nContext';

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
  const { t } = useI18n();
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
          <FileSpreadsheet size={22} color="var(--text-brand)" aria-hidden="true" />
          <div>
            <h2 id={titleId} className="card-title">
              {t.csvImport.title}
            </h2>
            <p className="card-caption">{fileName ?? t.csvImport.subtitleDefault}</p>
          </div>
        </div>
        <button
          type="button"
          className="btn-ghost"
          aria-label={t.csvImport.closeAria}
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
              <h3 className="card-title">{t.csvImport.summaryTitle}</h3>
            </div>

            <div className="import-stats-grid">
              <div className="import-stat-box">
                <span>{t.csvImport.importedNew}</span>
                <strong className="tabular-nums">{result.insertedCount}</strong>
              </div>
              <div className="import-stat-box">
                <span>{t.csvImport.updated}</span>
                <strong className="tabular-nums">{result.updatedCount}</strong>
              </div>
              <div className="import-stat-box">
                <span>{t.csvImport.skippedDuplicates}</span>
                <strong className="tabular-nums">{result.skippedCount}</strong>
              </div>
              <div className="import-stat-box">
                <span>{t.csvImport.invalidIgnored}</span>
                <strong className="tabular-nums">{result.invalidCount}</strong>
              </div>
            </div>

            {result.createdCategoriesCount > 0 && (
              <p style={{ margin: '0.75rem 0 0', fontSize: '0.85rem', color: 'var(--text-brand)' }}>
                {t.csvImport.createdCategories(result.createdCategoriesCount)}
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
                    <span>{t.csvImport.totalRows}</span>
                    <strong className="tabular-nums">{preview.totalRows}</strong>
                  </div>
                  <div className="import-stat-box">
                    <span>{t.csvImport.validRows}</span>
                    <strong className="tabular-nums" style={{ color: 'var(--income-fg)' }}>
                      {preview.validRows}
                    </strong>
                  </div>
                  <div className="import-stat-box">
                    <span>{t.csvImport.duplicateRows}</span>
                    <strong className="tabular-nums" style={{ color: 'var(--text-brand)' }}>
                      {preview.duplicateRows}
                    </strong>
                  </div>
                  <div className="import-stat-box">
                    <span>{t.csvImport.invalidRows}</span>
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
                      {t.csvImport.duplicateLegend(preview.duplicateRows)}
                    </legend>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.55rem', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="duplicate-strategy"
                          value="skip"
                          checked={strategy === 'skip'}
                          onChange={() => setStrategy('skip')}
                          style={{ marginTop: 4 }}
                        />
                        <span>
                          <strong>{t.csvImport.skipDuplicates}</strong>
                          <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {t.csvImport.skipDuplicatesDesc}
                          </span>
                        </span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.55rem', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="duplicate-strategy"
                          value="update"
                          checked={strategy === 'update'}
                          onChange={() => setStrategy('update')}
                          style={{ marginTop: 4 }}
                        />
                        <span>
                          <strong>{t.csvImport.updateExisting}</strong>
                          <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {t.csvImport.updateExistingDesc}
                          </span>
                        </span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.55rem', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name="duplicate-strategy"
                          value="import_as_new"
                          checked={strategy === 'import_as_new'}
                          onChange={() => setStrategy('import_as_new')}
                          style={{ marginTop: 4 }}
                        />
                        <span>
                          <strong>{t.csvImport.importAsNew}</strong>
                          <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {t.csvImport.importAsNewDesc}
                          </span>
                        </span>
                      </label>
                    </div>
                  </fieldset>
                )}

                {invalidRows.length > 0 && (
                  <div className="import-errors-list" role="region" aria-label={t.csvImport.invalidRows}>
                    <strong style={{ display: 'block', marginBottom: '0.35rem' }}>
                      {t.csvImport.validationErrorsTitle(invalidRows.length)}
                    </strong>
                    <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.84rem' }}>
                      {invalidRows.slice(0, 20).map((row) => (
                        <li key={row.rowNumber}>
                          <strong>{t.csvImport.rowPrefix(row.rowNumber)}</strong> {row.errors.join(' ')}
                        </li>
                      ))}
                      {invalidRows.length > 20 && (
                        <li>{t.csvImport.moreInvalidRows(invalidRows.length - 20)}</li>
                      )}
                    </ul>
                  </div>
                )}

                <div className="table-wrapper" style={{ maxBlockSize: '260px', marginBottom: '0.75rem' }}>
                  <table className="ledger-table import-preview-table">
                    <thead>
                      <tr>
                        <th scope="col">{t.csvImport.colRow}</th>
                        <th scope="col">{t.csvImport.colStatus}</th>
                        <th scope="col">{t.ledger.colDate}</th>
                        <th scope="col">{t.ledger.colType}</th>
                        <th scope="col">{t.ledger.colCategory}</th>
                        <th scope="col" style={{ textAlign: 'right' }}>{t.ledger.colAmount}</th>
                        <th scope="col">{t.ledger.colNote}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.rows.slice(0, PREVIEW_ROW_LIMIT).map((row) => (
                        <tr key={row.rowNumber}>
                          <td className="tabular-nums">{row.rowNumber}</td>
                          <td>
                            <span className={`import-status-pill import-status-pill--${row.status}`}>
                              {row.status === 'new'
                                ? t.csvImport.statusNew
                                : row.status === 'duplicate'
                                  ? t.csvImport.statusDuplicate
                                  : t.csvImport.statusInvalid}
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
                    {t.csvImport.previewLimitNote(PREVIEW_ROW_LIMIT, preview.rows.length, importableCount)}
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
            {t.csvImport.done}
          </button>
        ) : preview ? (
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => dialogRef.current?.close()}
            >
              {t.csvImport.cancel}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={isImporting || Boolean(preview.headerError) || importableCount === 0}
              onClick={() => onConfirmImport(strategy)}
            >
              {isImporting
                ? t.csvImport.importing
                : t.csvImport.importRows(importableCount)}
            </button>
          </>
        ) : (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => dialogRef.current?.close()}
          >
            {t.csvImport.close}
          </button>
        )}
      </div>
    </dialog>
  );
}
