import { ArrowLeft, Check, Mic, Square, X } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { DEFAULT_CATEGORIES } from '../../domain/ledgerLogic';
import { parseVoiceTranscript } from '../../domain/voiceParser';
import {
  SPEECH_LANGUAGE_OPTIONS,
  useVoiceInput,
  type SpeechLangCode,
  type VoiceErrorCode,
} from '../../hooks/useVoiceInput';
import { useI18n } from '../../i18n/I18nContext';
import { getCategoryLabel, getPaymentMethodLabel } from '../../i18n/translations';
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

/**
 * Converts Myanmar digits (၀-၉) and full-width digits to ASCII 0-9 for mobile keyboards.
 */
function normalizeNumericInput(raw: string): string {
  return raw
    .replace(/[\u1040-\u1049]/g, (ch) => String(ch.charCodeAt(0) - 0x1040))
    .replace(/[\uFF10-\uFF19]/g, (ch) => String(ch.charCodeAt(0) - 0xff10))
    .replace(/[,\s]/g, '')
    .trim();
}

export function EntryDrawer({
  isOpen,
  editingTx,
  initialType = 'expense',
  categories,
  currency,
  onCurrencyChange,
  isSaving,
  onClose,
  onBackToHome,
  onSubmit,
}: {
  isOpen: boolean;
  editingTx: Transaction | null;
  initialType?: TransactionType;
  categories: Category[];
  currency: CurrencyCode;
  onCurrencyChange: (next: CurrencyCode) => void;
  isSaving: boolean;
  onClose: () => void;
  onBackToHome?: () => void;
  onSubmit: (payload: CreateTransactionInput, keepOpen: boolean) => Promise<void>;
}) {
  const { language, t } = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const wasOpenRef = useRef(false);
  const titleId = useId();
  const amountHintId = useId();
  const amountErrorId = useId();

  const effectiveCategories = useMemo(
    () => (categories.length > 0 ? categories : DEFAULT_CATEGORIES),
    [categories]
  );

  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState('');
  const [categoryId, setCategoryId] = useState<number>(
    () => effectiveCategories.find((c) => c.type === 'expense')?.id ?? 6
  );
  const [transactionDate, setTransactionDate] = useState<string>(toLocalDateString());
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [note, setNote] = useState<string>('');
  const [amountInvalid, setAmountInvalid] = useState(false);
  const [amountErrorMsg, setAmountErrorMsg] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);
  const [dictationInput, setDictationInput] = useState('');
  const voiceLangSelectId = useId();
  const dictationInputId = useId();

  const filteredCategories = useMemo(
    () => effectiveCategories.filter((c) => c.type === type),
    [effectiveCategories, type]
  );

  const handleParsedVoice = useCallback(
    (transcript: string) => {
      const parsed = parseVoiceTranscript(transcript, effectiveCategories);
      setServerError(null);

      if (parsed.type) {
        setType(parsed.type);
      }
      if (parsed.amount !== null) {
        setAmountStr(String(parsed.amount));
        setAmountInvalid(false);
        setAmountErrorMsg('');
      }
      if (parsed.categoryId !== null) {
        setCategoryId(parsed.categoryId);
      }
      if (parsed.paymentMethod) {
        setPaymentMethod(parsed.paymentMethod);
      }
      if (parsed.transactionDate) {
        setTransactionDate(parsed.transactionDate);
      }
      if (parsed.note) {
        setNote(parsed.note);
      }
    },
    [effectiveCategories]
  );

  const {
    isSupported: isVoiceSupported,
    speechLang,
    setSpeechLang,
    status: voiceStatus,
    interimTranscript,
    finalTranscript,
    errorCode: voiceErrorCode,
    startListening,
    stopListening,
    cancelListening,
    clearFeedback: clearVoiceFeedback,
    acceptTranscript,
  } = useVoiceInput({
    defaultLang: 'en-US',
    onResultTranscript: handleParsedVoice,
  });

  const getVoiceErrorMessage = (code: VoiceErrorCode | null): string | null => {
    if (!code) return null;
    switch (code) {
      case 'not-allowed':
        return t.voice.errNotAllowed;
      case 'service-not-allowed':
        return t.voice.errServiceNotAllowed;
      case 'language-not-supported':
        return t.voice.errLanguageUnsupported;
      case 'no-speech':
        return t.voice.errNoSpeech;
      case 'network':
        return t.voice.errNetwork;
      case 'audio-capture':
        return t.voice.errAudioCapture;
      case 'unsupported':
        return t.voice.unsupportedNotice;
      default:
        return t.voice.errGeneric;
    }
  };

  // Sync form state ONLY when opening or switching editingTx (never wipe typed input when categories load)
  useEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false;
      cancelListening();
      clearVoiceFeedback();
      setDictationInput('');
      return;
    }

    const justOpened = !wasOpenRef.current;
    wasOpenRef.current = true;

    if (!justOpened && !editingTx) {
      return;
    }

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
      const nextType = initialType;
      setType(nextType);
      setAmountStr('');
      const defaultCat = effectiveCategories.find((c) => c.type === nextType);
      setCategoryId(defaultCat?.id ?? (nextType === 'income' ? 1 : 6));
      setTransactionDate(toLocalDateString());
      setPaymentMethod('Cash');
      setNote('');
    }
    // Stop active speech recognition on drawer close/reset
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editingTx, initialType, effectiveCategories]);

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
    const cleaned = normalizeNumericInput(raw);
    const num = Number(cleaned);
    if (!cleaned || Number.isNaN(num) || num <= 0) {
      setAmountInvalid(true);
      setAmountErrorMsg(t.entry.amountInvalidMsg);
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
      setServerError(t.entry.amountSubmitError);
      amountInputRef.current?.focus();
      return;
    }

    const safeCategoryId =
      filteredCategories.some((c) => c.id === categoryId)
        ? categoryId
        : (filteredCategories[0]?.id ?? 0);

    if (!safeCategoryId) {
      setServerError(t.entry.categoryMissingError);
      return;
    }

    const safeDate = /^\d{4}-\d{2}-\d{2}$/.test(transactionDate)
      ? transactionDate
      : toLocalDateString();

    try {
      await onSubmit(
        {
          type,
          amount: parsedAmount,
          categoryId: safeCategoryId,
          transactionDate: safeDate,
          paymentMethod,
          note: note.trim() || null,
        },
        keepOpen
      );

      if (keepOpen) {
        setAmountStr('');
        setNote('');
        setAmountInvalid(false);
        setAmountErrorMsg('');
        setDictationInput('');
        clearVoiceFeedback();
        amountInputRef.current?.focus();
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : t.entry.saveFailed);
    }
  };

  const handleBackNavigation = () => {
    if (onBackToHome) {
      onBackToHome();
    } else {
      dialogRef.current?.close();
    }
  };

  const handleApplyDictation = () => {
    const cleaned = dictationInput.trim();
    if (!cleaned) return;
    acceptTranscript(cleaned);
    setDictationInput('');
  };

  const handleSwitchToEnglishMic = () => {
    setSpeechLang('en-US');
    clearVoiceFeedback();
  };

  const parsedAmountPreview = Number(normalizeNumericInput(amountStr));
  const hasValidAmount = Number.isFinite(parsedAmountPreview) && parsedAmountPreview > 0;
  const voiceErrorMessage = getVoiceErrorMessage(voiceErrorCode);

  return (
    <dialog
      ref={dialogRef}
      className="entry-dialog"
      aria-labelledby={titleId}
      {...({ closedby: 'any' } as Record<string, unknown>)}
    >
      <div className="dialog-header entry-dialog-header">
        <button
          type="button"
          className="entry-back-btn"
          aria-label={t.entry.backAria}
          onClick={handleBackNavigation}
        >
          <ArrowLeft size={22} aria-hidden="true" />
        </button>
        <div className="entry-header-text">
          <h2 id={titleId} className="card-title">
            {editingTx ? t.entry.editTitle : t.entry.addTitle}
          </h2>
          <p className="card-caption">{t.entry.subtitle}</p>
        </div>
      </div>

      <form
        className="entry-form-shell"
        onSubmit={(e) => handleSubmit(e, false)}
        noValidate
      >
        <div className="dialog-body">
          <section
            className={`voice-entry-card${voiceStatus === 'listening' ? ' is-listening' : ''}`}
            aria-label={t.voice.sectionLabel}
          >
            {voiceStatus === 'listening' ? (
              <div className="voice-listening-box">
                <div className="voice-listening-head">
                  <span className="voice-pulse-badge" aria-hidden="true">
                    <Mic size={16} />
                  </span>
                  <span className="voice-listening-label" role="status" aria-live="polite">
                    {t.voice.listening}
                  </span>
                </div>

                <p className="voice-transcript-box" aria-live="polite">
                  {interimTranscript || t.voice.interimPlaceholder}
                </p>

                <div className="voice-action-pair">
                  <button
                    type="button"
                    className="btn btn-primary voice-action-btn"
                    onClick={stopListening}
                  >
                    <Square size={14} aria-hidden="true" />
                    <span>{t.voice.stopBtn}</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary voice-action-btn"
                    onClick={cancelListening}
                  >
                    <span>{t.voice.cancelBtn}</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="voice-controls-row">
                  <button
                    type="button"
                    className="btn voice-mic-btn"
                    disabled={!isVoiceSupported || isSaving}
                    aria-disabled={!isVoiceSupported ? 'true' : undefined}
                    onClick={startListening}
                  >
                    <Mic size={18} aria-hidden="true" />
                    <span>{t.voice.startBtn}</span>
                  </button>

                  {isVoiceSupported && (
                    <div className="voice-lang-wrap">
                      <label htmlFor={voiceLangSelectId} className="visually-hidden">
                        {t.voice.speechLangLabel}
                      </label>
                      <select
                        id={voiceLangSelectId}
                        className="control-select voice-lang-select"
                        value={speechLang}
                        onChange={(e) => setSpeechLang(e.target.value as SpeechLangCode)}
                      >
                        {SPEECH_LANGUAGE_OPTIONS.map((opt) => (
                          <option key={opt.code} value={opt.code}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {!isVoiceSupported ? (
                  <p className="voice-unsupported-note">{t.voice.unsupportedNotice}</p>
                ) : (
                  <p className="voice-hint-text">{t.voice.tapHint}</p>
                )}
              </>
            )}

            {voiceErrorMessage && voiceStatus === 'error' && (
              <div role="alert" className="voice-error-banner">
                {voiceErrorMessage}
              </div>
            )}

            {(!isVoiceSupported ||
              (voiceStatus === 'error' &&
                (voiceErrorCode === 'language-not-supported' ||
                  voiceErrorCode === 'service-not-allowed' ||
                  voiceErrorCode === 'not-allowed' ||
                  voiceErrorCode === 'unsupported'))) &&
              voiceStatus !== 'listening' && (
                <div className="voice-error-actions">
                  {voiceStatus === 'error' &&
                    voiceErrorCode === 'language-not-supported' &&
                    isVoiceSupported &&
                    speechLang !== 'en-US' && (
                      <button
                        type="button"
                        className="btn-ghost voice-switch-btn"
                        onClick={handleSwitchToEnglishMic}
                      >
                        {t.voice.switchToEnglishMic}
                      </button>
                    )}

                  <div className="voice-fallback-dictate">
                    <label htmlFor={dictationInputId} className="voice-dictate-label">
                      {t.voice.dictateLabel}
                    </label>
                    <div className="voice-dictate-row">
                      <input
                        id={dictationInputId}
                        type="text"
                        className="field-input voice-dictate-input"
                        value={dictationInput}
                        onChange={(e) => setDictationInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                            e.preventDefault();
                            handleApplyDictation();
                          }
                        }}
                        enterKeyHint="done"
                        placeholder={t.voice.dictatePlaceholder}
                        disabled={isSaving}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary voice-dictate-btn"
                        disabled={!dictationInput.trim() || isSaving}
                        onClick={handleApplyDictation}
                      >
                        {t.voice.dictateApplyBtn}
                      </button>
                    </div>
                  </div>
                </div>
              )}

            {finalTranscript && voiceStatus !== 'listening' && (
              <div role="status" aria-live="polite" className="voice-result-banner">
                <div className="voice-result-content">
                  <span className="voice-result-label">{t.voice.heardLabel}:</span>{' '}
                  <span className="voice-result-text">“{finalTranscript}”</span>
                </div>
                <div className="voice-result-actions">
                  {hasValidAmount && (
                    <button
                      type="button"
                      className="btn btn-primary voice-confirm-btn"
                      disabled={isSaving}
                      onClick={(e) => handleSubmit(e, false)}
                    >
                      <Check size={14} aria-hidden="true" />
                      <span>{t.voice.confirmSaveBtn}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-ghost voice-dismiss-btn"
                    aria-label={t.voice.clearTranscriptAria}
                    onClick={clearVoiceFeedback}
                  >
                    <X size={15} aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}
          </section>

          <fieldset className="segmented-toggle">
            <legend className="visually-hidden">{t.entry.typeLegend}</legend>
            <label className="segmented-option segmented-option--income">
              <input
                type="radio"
                name="tx-type"
                value="income"
                checked={type === 'income'}
                onChange={() => setType('income')}
                className="visually-hidden"
              />
              <span>{t.entry.income}</span>
            </label>
            <label className="segmented-option segmented-option--expense">
              <input
                type="radio"
                name="tx-type"
                value="expense"
                checked={type === 'expense'}
                onChange={() => setType('expense')}
                className="visually-hidden"
              />
              <span>{t.entry.expense}</span>
            </label>
          </fieldset>

          <div className="form-field">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
              <label htmlFor="entry-amount" className="form-label">
                {t.entry.amountLabel(CURRENCY_CONFIGS[currency].symbol)} <span aria-hidden="true">*</span>
              </label>
              <select
                aria-label={t.settings.currencyLabel}
                value={currency}
                onChange={(e) => onCurrencyChange(e.target.value as CurrencyCode)}
                className="control-select"
                style={{ minHeight: 34, padding: '0.2rem 0.55rem', fontSize: '0.8rem' }}
              >
                {Object.values(CURRENCY_CONFIGS).map((cfg) => (
                  <option key={cfg.code} value={cfg.code}>
                    {t.currencies[cfg.code]}
                  </option>
                ))}
              </select>
            </div>
            <span id={amountHintId} className="form-hint">
              {t.entry.amountHint(CURRENCY_CONFIGS[currency].example)}
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
                if (serverError) setServerError(null);
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
              <span aria-hidden="true">!</span>{' '}
              {amountErrorMsg || t.entry.amountInvalidMsg}
            </div>
          </div>

          <fieldset className="form-field" style={{ border: 0, padding: 0 }}>
            <legend className="form-label" style={{ marginBottom: '0.45rem' }}>
              {t.entry.categoryLabel} <span aria-hidden="true">*</span>
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
                  <span>{getCategoryLabel(cat, language)}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="form-field">
            <label htmlFor="entry-date" className="form-label">
              {t.entry.dateLabel}
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
              {t.entry.paymentLabel}
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
                  {getPaymentMethodLabel(method, language)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="entry-note" className="form-label">
              {t.entry.noteLabel}
            </label>
            <input
              id="entry-note"
              name="note"
              type="text"
              maxLength={255}
              placeholder={t.entry.notePlaceholder}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="form-input"
            />
          </div>
        </div>

        <div className="dialog-footer" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          {serverError && (
            <div
              role="alert"
              style={{
                padding: '0.65rem 0.85rem',
                borderRadius: '10px',
                background: 'var(--expense-bg)',
                color: 'var(--expense-fg)',
                fontSize: '0.85rem',
                fontWeight: 500,
              }}
            >
              {serverError}
            </div>
          )}

          <div
            className={`entry-footer-actions${
              editingTx ? ' entry-footer-actions--single' : ''
            }`}
          >
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving
                ? t.entry.saving
                : editingTx
                  ? t.entry.update
                  : t.entry.save}
            </button>

            {!editingTx && (
              <button
                type="button"
                className="btn btn-secondary"
                disabled={isSaving}
                onClick={(e) => handleSubmit(e, true)}
              >
                {t.entry.saveAndAnother}
              </button>
            )}
          </div>
        </div>
      </form>
    </dialog>
  );
}
