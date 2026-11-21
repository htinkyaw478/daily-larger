import { afterEach, describe, expect, it } from 'vitest';
import {
  getSavedCurrencyPreference,
  getSavedLanguagePreference,
  getSavedSidebarCollapsed,
  getSavedThemePreference,
  saveCurrencyPreference,
  saveLanguagePreference,
  saveSidebarCollapsed,
  saveThemePreference,
} from '../storage/ledgerStorage';
import {
  formatLocalizedFullDate,
  formatLocalizedShortDate,
  getCategoryLabel,
  getPaymentMethodLabel,
  getTypeLabel,
  SUPPORTED_LANGUAGES,
  TRANSLATIONS,
} from './translations';

const MYANMAR_SCRIPT_REGEX = /[\u1000-\u109F]/;
const HANGUL_SCRIPT_REGEX = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/;
const KANA_SCRIPT_REGEX = /[\u3040-\u30FF]/;

const AUTONYM_PATHS = new Set([
  'settings.burmeseLabel',
  'settings.englishLabel',
  'settings.koreanLabel',
  'settings.japaneseLabel',
]);

function collectStrings(
  obj: unknown,
  path = '',
  out: Array<{ path: string; value: string }> = []
): Array<{ path: string; value: string }> {
  if (typeof obj === 'string') {
    out.push({ path, value: obj });
  } else if (obj && typeof obj === 'object') {
    for (const [key, val] of Object.entries(obj)) {
      const nextPath = path ? `${path}.${key}` : key;
      collectStrings(val, nextPath, out);
    }
  }
  return out;
}

describe('i18n translations & single-language guarantees (my, en, ko, ja)', () => {
  it('keeps matching top-level and nested keys across all supported languages', () => {
    const baseSections = Object.keys(TRANSLATIONS.my).sort();
    for (const lang of SUPPORTED_LANGUAGES) {
      expect(Object.keys(TRANSLATIONS[lang]).sort()).toEqual(baseSections);
      for (const section of baseSections as Array<keyof typeof TRANSLATIONS.my>) {
        expect(Object.keys(TRANSLATIONS[lang][section]).sort()).toEqual(
          Object.keys(TRANSLATIONS.my[section]).sort()
        );
      }
    }
  });

  it('keeps each locale free of foreign script mixing (except language selector autonyms)', () => {
    const enOffending = collectStrings(TRANSLATIONS.en).filter(
      ({ path, value }) =>
        !AUTONYM_PATHS.has(path) &&
        (MYANMAR_SCRIPT_REGEX.test(value) ||
          HANGUL_SCRIPT_REGEX.test(value) ||
          KANA_SCRIPT_REGEX.test(value))
    );
    expect(enOffending).toEqual([]);

    const koOffending = collectStrings(TRANSLATIONS.ko).filter(
      ({ path, value }) =>
        !AUTONYM_PATHS.has(path) &&
        (MYANMAR_SCRIPT_REGEX.test(value) || KANA_SCRIPT_REGEX.test(value))
    );
    expect(koOffending).toEqual([]);

    const jaOffending = collectStrings(TRANSLATIONS.ja).filter(
      ({ path, value }) =>
        !AUTONYM_PATHS.has(path) &&
        (MYANMAR_SCRIPT_REGEX.test(value) || HANGUL_SCRIPT_REGEX.test(value))
    );
    expect(jaOffending).toEqual([]);
  });

  it('never uses legacy bilingual separator across UI translations', () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      const entries = collectStrings(TRANSLATIONS[lang]);
      const mixed = entries.filter(({ value }) => value.includes('·'));
      expect(mixed).toEqual([]);
    }
  });

  it('localizes built-in categories across my/en/ko/ja while keeping custom categories verbatim', () => {
    const customCat = { name: 'Side Hustle / မုန့်ဖိုး', nameMy: 'Ignored', isDefault: false };
    for (const lang of SUPPORTED_LANGUAGES) {
      expect(getCategoryLabel(customCat, lang)).toBe('Side Hustle / မုန့်ဖိုး');
    }

    const defaultCat = { name: 'Food & Dining', nameMy: 'အစားအသောက်', isDefault: true };
    expect(getCategoryLabel(defaultCat, 'my')).toBe('အစားအသောက်');
    expect(getCategoryLabel(defaultCat, 'en')).toBe('Food & Dining');
    expect(getCategoryLabel(defaultCat, 'ko')).toBe('식비');
    expect(getCategoryLabel(defaultCat, 'ja')).toBe('食費');

    const csvCustomBreakdown = { name: 'Coffee Shop', nameMy: null };
    for (const lang of SUPPORTED_LANGUAGES) {
      expect(getCategoryLabel(csvCustomBreakdown, lang)).toBe('Coffee Shop');
    }
  });

  it('localizes payment methods, transaction types, and dates strictly per language', () => {
    expect(getPaymentMethodLabel('Cash', 'my')).toBe('ငွေသား');
    expect(getPaymentMethodLabel('Cash', 'en')).toBe('Cash');
    expect(getPaymentMethodLabel('Cash', 'ko')).toBe('현금');
    expect(getPaymentMethodLabel('Cash', 'ja')).toBe('現金');

    expect(getTypeLabel('income', 'my')).toBe('ဝင်ငွေ');
    expect(getTypeLabel('expense', 'en')).toBe('Expense');
    expect(getTypeLabel('income', 'ko')).toBe('수입');
    expect(getTypeLabel('expense', 'ja')).toBe('支出');

    expect(formatLocalizedShortDate('2026-11-21', 'my')).toBe('နို 21');
    expect(formatLocalizedFullDate('2026-11-21', 'my')).toBe('နိုဝင်ဘာ 21, 2026');
    expect(formatLocalizedShortDate('2026-11-21', 'en')).toBe('Nov 21');
    expect(formatLocalizedFullDate('2026-11-21', 'en')).toBe('Nov 21, 2026');
    expect(formatLocalizedShortDate('2026-11-21', 'ko')).toContain('11');
    expect(formatLocalizedFullDate('2026-11-21', 'ko')).toContain('2026');
    expect(formatLocalizedShortDate('2026-11-21', 'ja')).toBe('11月21日');
    expect(formatLocalizedFullDate('2026-11-21', 'ja')).toBe('2026年11月21日');
  });
});

describe('ledgerStorage preference persistence', () => {
  const originalWindow = (globalThis as { window?: unknown }).window;

  afterEach(() => {
    if (originalWindow === undefined) {
      delete (globalThis as { window?: unknown }).window;
    } else {
      (globalThis as { window?: unknown }).window = originalWindow;
    }
  });

  function installMockWindow(prefersDark = false) {
    const store = new Map<string, string>();
    (globalThis as { window: unknown }).window = {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, val: string) => {
          store.set(key, String(val));
        },
        removeItem: (key: string) => {
          store.delete(key);
        },
      },
      matchMedia: (query: string) => ({
        matches: query.includes('dark') ? prefersDark : false,
      }),
    };
    return store;
  }

  it('persists and reads theme, language (my/en/ko/ja), sidebar state, and currency safely', () => {
    installMockWindow(false);

    expect(getSavedThemePreference()).toBe('light');
    saveThemePreference('dark');
    expect(getSavedThemePreference()).toBe('dark');

    expect(getSavedLanguagePreference()).toBe('my');
    saveLanguagePreference('en');
    expect(getSavedLanguagePreference()).toBe('en');
    saveLanguagePreference('ko');
    expect(getSavedLanguagePreference()).toBe('ko');
    saveLanguagePreference('ja');
    expect(getSavedLanguagePreference()).toBe('ja');

    expect(getSavedSidebarCollapsed()).toBe(false);
    saveSidebarCollapsed(true);
    expect(getSavedSidebarCollapsed()).toBe(true);

    expect(getSavedCurrencyPreference()).toBe('MMK');
    saveCurrencyPreference('KRW');
    expect(getSavedCurrencyPreference()).toBe('KRW');
  });

  it('respects system dark preference when no explicit theme has been saved', () => {
    installMockWindow(true);
    expect(getSavedThemePreference()).toBe('dark');
  });
});
