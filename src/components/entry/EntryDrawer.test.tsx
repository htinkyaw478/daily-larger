import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_CATEGORIES } from '../../domain/ledgerLogic';
import { mapSpeechError } from '../../hooks/useVoiceInput';
import { I18nContext } from '../../i18n/I18nContext';
import { TRANSLATIONS, type LanguageCode } from '../../i18n/translations';
import type { Transaction } from '../../types/ledger';
import { EntryDrawer } from './EntryDrawer';

function renderDrawer(lang: LanguageCode, editingTx: Transaction | null = null) {
  return renderToStaticMarkup(
    <I18nContext.Provider
      value={{
        language: lang,
        setLanguage: vi.fn(),
        t: TRANSLATIONS[lang],
      }}
    >
      <EntryDrawer
        isOpen
        editingTx={editingTx}
        categories={DEFAULT_CATEGORIES}
        currency="MMK"
        onCurrencyChange={vi.fn()}
        isSaving={false}
        onClose={vi.fn()}
        onBackToHome={vi.fn()}
        onSubmit={vi.fn(async () => undefined)}
      />
    </I18nContext.Provider>
  );
}

describe('EntryDrawer mobile header, tabs, voice input, and horizontal save actions', () => {
  const originalWindow = (globalThis as { window?: unknown }).window;

  afterEach(() => {
    if (originalWindow === undefined) {
      delete (globalThis as { window?: unknown }).window;
    } else {
      (globalThis as { window?: unknown }).window = originalWindow;
    }
  });
  it('renders a top-left minimal back-arrow button instead of a close X button', () => {
    const htmlEn = renderDrawer('en');
    expect(htmlEn).toContain('class="dialog-header entry-dialog-header"');
    expect(htmlEn).toContain('class="entry-back-btn"');
    expect(htmlEn).toContain('aria-label="Back to Home"');
    expect(htmlEn).toContain('lucide-arrow-left');
    expect(htmlEn).not.toContain('lucide-x');
    expect(htmlEn.indexOf('entry-back-btn')).toBeLessThan(htmlEn.indexOf('entry-header-text'));

    const htmlMy = renderDrawer('my');
    expect(htmlMy).toContain('aria-label="ပင်မစာမျက်နှာသို့ ပြန်သွားရန်"');
  });

  it('places Save Entry (primary) and Save & Add Another (secondary) side-by-side in add mode', () => {
    const htmlEn = renderDrawer('en');
    expect(htmlEn).toContain('class="entry-footer-actions"');
    expect(htmlEn).not.toContain('entry-footer-actions--single');
    expect(htmlEn).toContain('<button type="submit" class="btn btn-primary">Save Entry</button>');
    expect(htmlEn).toContain(
      '<button type="button" class="btn btn-secondary">Save &amp; Add Another</button>'
    );

    const htmlMy = renderDrawer('my');
    expect(htmlMy).toContain('>သိမ်းမည်</button>');
    expect(htmlMy).toContain('>သိမ်းပြီး ထပ်ထည့်မည်</button>');
  });

  it('keeps single-action layout when editing an existing transaction', () => {
    const sampleTx: Transaction = {
      id: 42,
      type: 'expense',
      amount: 5000,
      categoryId: DEFAULT_CATEGORIES[5].id,
      transactionDate: '2026-11-21',
      paymentMethod: 'Cash',
      note: 'Tea',
      createdAt: '2026-11-21T00:00:00.000Z',
      updatedAt: '2026-11-21T00:00:00.000Z',
      category: DEFAULT_CATEGORIES[5],
    };

    const html = renderDrawer('en', sampleTx);
    expect(html).toContain('class="entry-footer-actions entry-footer-actions--single"');
    expect(html).toContain('>Update Entry</button>');
    expect(html).not.toContain('Save &amp; Add Another');
  });

  it('orders Income on the left and Expense on the right consistently', () => {
    for (const lang of ['en', 'my', 'ko', 'ja'] as const) {
      const html = renderDrawer(lang);
      const incomeIdx = html.indexOf('segmented-option--income');
      const expenseIdx = html.indexOf('segmented-option--expense');
      expect(incomeIdx).toBeGreaterThan(-1);
      expect(expenseIdx).toBeGreaterThan(incomeIdx);
    }
  });

  it('renders mobile-friendly Voice Input controls with graceful fallback when SpeechRecognition is unavailable', () => {
    const html = renderDrawer('en');
    expect(html).toContain('class="voice-entry-card"');
    expect(html).toContain('class="btn voice-mic-btn"');
    expect(html).toContain('type="button"');
    expect(html).toContain('Voice Entry');
    expect(html).toContain('Voice input is unavailable in this browser.');

    const htmlMy = renderDrawer('my');
    expect(htmlMy).toContain('အသံဖြင့် ထည့်ရန်');
  });

  it('renders enabled Voice Input trigger with en-US default and language selector when webkitSpeechRecognition is available', () => {
    (globalThis as { window: unknown }).window = {
      webkitSpeechRecognition: class {},
    };

    const html = renderDrawer('en');
    expect(html).toContain('class="btn voice-mic-btn"');
    expect(html).not.toContain('aria-disabled="true"');
    expect(html).toContain('voice-lang-select');
    expect(html).toContain('<option value="en-US" selected="">English (US)</option>');
    expect(html).toContain('<option value="my-MM">မြန်မာ (MM)</option>');
    expect(html).toContain('Tap mic and say');
  });

  it('maps Web Speech API errors consistently across mobile browsers', () => {
    expect(mapSpeechError('not-allowed')).toBe('not-allowed');
    expect(mapSpeechError('service-not-allowed')).toBe('not-allowed');
    expect(mapSpeechError('no-speech')).toBe('no-speech');
    expect(mapSpeechError('network')).toBe('network');
    expect(mapSpeechError('audio-capture')).toBe('audio-capture');
    expect(mapSpeechError('other')).toBe('unknown');
  });
});
