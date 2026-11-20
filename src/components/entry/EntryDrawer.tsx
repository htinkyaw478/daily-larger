import { X } from 'lucide-react';
import { FormEvent, useEffect, useId, useMemo, useRef, useState } from 'react';
import type {
  Category,
  CreateTransactionInput,
  Transaction,
  TransactionType,
} from '../../types/ledger';
import {
  CURRENCY_CONFIGS,
  toLocalDateString,
  type CurrencyCode,
} from '../../utils/formatters';
import { CategoryIcon } from '../ui/CategoryIcon';

const PAYMENT_METHODS = ['Cash', 'KBZPay', 'WavePay', 'Bank Transfer', 'Card'];

export function EntryDrawer({
  isOpen,
  editingTx,
  categories,
  currency,
  onCurrencyChange,
  isSaving,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  editingTx: Transaction | null;
  categories: Category[];
  currency: CurrencyCode;
  onCurrencyChange: (next: CurrencyCode) => void;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateTransactionInput, keepOpen: boolean) => Promise<void>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const amountHintId = useId();
  const amountErrorId = useId();

  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState('');
  const [categoryId, setCategoryId] = useState<number>(0);
  const [transactionDate, setTransactionDate] = useState<string>(toLocalDateString());
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [note, setNote] = useState<string>('');
  const [amountInvalid, setAmountInvalid] = useState(false);
  const [amountErrorMsg, setAmountErrorMsg] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type]
  );

  // Sync form state when opening for Create vs Edit
  useEffect(() => {
    if (!isOpen) return;
    setServerError(null);
    setAmountInvalid(false);
    setAmountErrorMsg('');

    if (editingTx) {
      setType(editingTx.type);
      setAmountStr(String(editingTx.amount));
      setCategoryId(editingTx.categoryId);
      setTransactionDate(editingTx.transactionDate);
      setPaymentMethod(editingTx.paymentMethod);
      setNote(editingTx.note ?? '');
    } else {
      setType('expense');
      setAmountStr('');
      const defaultExpense = categories.find((c) => c.type === 'expense');
      setCategoryId(defaultExpense?.id ?? 0);
      setTransactionDate(toLocalDateString());
      setPaymentMethod('Cash');
      setNote('');
    }
  }, [isOpen, editingTx, categories]);

  // Keep categoryId aligned when switching between Income and Expense
  useEffect(() => {
    if (!filteredCategories.some((c) => c.id === categoryId)) {
      setCategoryId(filteredCategories[0]?.id ?? 0);
    }
  }, [filteredCategories, categoryId]);

  // Manage native <dialog> top-layer modal open/close & Safari closedby="any" fallback
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

    // Light-dismiss fallback for browsers lacking closedBy support (e.g., Safari)
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

  const validateAmount = (raw: string): number | null => {
    const cleaned = raw.replace(/,/g, '').trim();
    const num = Number(cleaned);
    if (!cleaned || Number.isNaN(num) || num <= 0) {
      setAmountInvalid(true);
      setAmountErrorMsg('Enter an amount greater than 0 (e.g., 15000).');
      return null;
    }
    setAmountInvalid(false);
    setAmountErrorMsg('');
    return num;
  };

  const handleSubmit = async (e: FormEvent, keepOpen = false) => {
    e.preventDefault();
    setServerError(null);

    const parsedAmount = validateAmount(amountStr);
    if (parsedAmount === null) {
      amountInputRef.current?.focus();
      return;
    }

    if (!categoryId) {
      setServerError('Please select a category.');
      return;
    }

    try {
      await onSubmit(
        {
          type,
          amount: parsedAmount,
          categoryId,
          transactionDate,
          paymentMethod,
          note: note.trim() || null,
        },
        keepOpen
      );

      if (keepOpen) {
        setAmountStr('');
        setNote('');
        setAmountInvalid(false);
        amountInputRef.current?.focus();
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Unable to save entry');
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="entry-dialog"
      aria-labelledby={titleId}
      {...({ closedby: 'any' } as Record<string, unknown>)}
    >
      <div className="dialog-header">
        <div>
          <h2 id={titleId} className="card-title">
            {editingTx ? 'စာရင်းပြင်ဆင်ရန် · Edit Entry' : 'စာရင်းသစ် ထည့်ရန် · Add Entry'}
          </h2>
          <p className="card-caption">Saves directly to your ledger and updates totals</p>
        </div>
        <button
          type="button"
          className="btn-ghost"
          aria-label="Close entry form"
          onClick={() => dialogRef.current?.close()}
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>

      <div className="dialog-body">
        <form onSubmit={(e) => handleSubmit(e, false)} noValidate>
          <fieldset className="segmented-toggle">
            <legend className="visually-hidden">Transaction type</legend>
            <label className="segmented-option segmented-option--expense">
              <input
                type="radio"
                name="tx-type"
                value="expense"
                checked={type === 'expense'}
                onChange={() => setType('expense')}
                className="visually-hidden"
              />
              <span>ထွက်ငွေ · Expense</span>
            </label>
            <label className="segmented-option segmented-option--income">
              <input
                type="radio"
                name="tx-type"
                value="income"
                checked={type === 'income'}
                onChange={() => setType('income')}
                className="visually-hidden"
              />
              <span>ဝင်ငွေ · Income</span>
            </label>
          </fieldset>

          <div className="form-field">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
              <label htmlFor="entry-amount" className="form-label">
                ပမာဏ · Amount ({CURRENCY_CONFIGS[currency].symbol}) <span aria-hidden="true">*</span>
              </label>
              <select
                aria-label="Entry currency"
                value={currency}
                onChange={(e) => onCurrencyChange(e.target.value as CurrencyCode)}
                className="control-select"
                style={{ minHeight: 34, padding: '0.2rem 0.55rem', fontSize: '0.8rem' }}
              >
                {Object.values(CURRENCY_CONFIGS).map((cfg) => (
                  <option key={cfg.code} value={cfg.code}>
                    {cfg.label}
                  </option>
                ))}
              </select>
            </div>
            <span id={amountHintId} className="form-hint">
              Numbers only, e.g. {CURRENCY_CONFIGS[currency].example}
            </span>
            <input
              ref={amountInputRef}
              id="entry-amount"
              name="amount"
              type="text"
              inputMode="decimal"
              required
              autoFocus
              placeholder="0"
              value={amountStr}
              className={`form-input form-input--amount tabular-nums ${
                amountInvalid ? 'user-invalid-fallback' : ''
              }`}
              aria-invalid={amountInvalid ? 'true' : 'false'}
              aria-describedby={
                amountInvalid ? `${amountHintId} ${amountErrorId}` : amountHintId
              }
              onChange={(e) => {
                setAmountStr(e.target.value);
                if (amountInvalid) {
                  validateAmount(e.target.value);
                }
              }}
              onBlur={() => {
                if (amountStr.trim() !== '') {
                  validateAmount(amountStr);
                }
              }}
            />
            <div id={amountErrorId} className="error-msg">
              <span role="img" aria-label="Error">
                !
              </span>{' '}
              {amountErrorMsg || 'Please enter a valid positive amount.'}
            </div>
          </div>

          <fieldset className="form-field" style={{ border: 0, padding: 0 }}>
            <legend className="form-label" style={{ marginBottom: '0.45rem' }}>
              အမျိုးအစား · Category <span aria-hidden="true">*</span>
            </legend>
            <div className="category-pill-grid">
              {filteredCategories.map((cat) => (
                <label key={cat.id} className="category-pill-radio">
                  <input
                    type="radio"
                    name="tx-category"
                    value={cat.id}
                    checked={categoryId === cat.id}
                    onChange={() => setCategoryId(cat.id)}
                    className="visually-hidden"
                  />
                  <span
                    className="category-dot"
                    style={{
                      width: 26,
                      height: 26,
                      background: `${cat.color}1a`,
                      color: cat.color,
                    }}
                  >
                    <CategoryIcon name={cat.icon} size={14} />
                  </span>
                  <span>{cat.nameMy ? `${cat.nameMy} · ${cat.name}` : cat.name}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="form-field">
            <label htmlFor="entry-date" className="form-label">
              ရက်စွဲ · Date
            </label>
            <input
              id="entry-date"
              name="transactionDate"
              type="date"
              required
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="form-input tabular-nums"
            />
          </div>

          <div className="form-field">
            <label htmlFor="entry-payment" className="form-label">
              ငွေပေးချေမှု · Payment Method
            </label>
            <select
              id="entry-payment"
              name="paymentMethod"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="form-select"
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="entry-note" className="form-label">
              မှတ်ချက် · Note (Optional)
            </label>
            <input
              id="entry-note"
              name="note"
              type="text"
              maxLength={255}
              placeholder="e.g., နေ့လယ်စာ, ဆိုင်ရောင်းရငွေ"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="form-input"
            />
          </div>

          {serverError && (
            <div
              role="alert"
              style={{
                padding: '0.75rem 0.9rem',
                borderRadius: '10px',
                background: 'var(--expense-bg)',
                color: 'var(--expense-fg)',
                marginBottom: '1rem',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              {serverError}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '1.25rem' }}>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving
                ? 'Saving...'
                : editingTx
                  ? 'ပြင်ဆင်မှု သိမ်းမည် · Update Entry'
                  : 'သိမ်းမည် · Save Entry'}
            </button>

            {!editingTx && (
              <button
                type="button"
                className="btn btn-secondary"
                disabled={isSaving}
                onClick={(e) => handleSubmit(e, true)}
              >
                Save & Add Another
              </button>
            )}
          </div>
        </form>
      </div>
    </dialog>
  );
}
