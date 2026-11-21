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
  TRANSLATIONS,
} from './translations';

const MYANMAR_SCRIPT_REGEX = /[\u1000-\u109F]/;

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

describe('i18n translations & single-language guarantees', () => {
  it('keeps matching top-level and nested keys across my and en', () => {
    expect(Object.keys(TRANSLATIONS.my).sort()).toEqual(Object.keys(TRANSLATIONS.en).sort());
    for (const section of Object.keys(TRANSLATIONS.my) as Array<keyof typeof TRANSLATIONS.my>) {
      expect(Object.keys(TRANSLATIONS.my[section]).sort()).toEqual(
        Object.keys(TRANSLATIONS.en[section]).sort()
      );
    }
  });

  it('never mixes Myanmar script into English UI strings (except the Burmese language autonym)', () => {
    const entries = collectStrings(TRANSLATIONS.en);
    const offending = entries.filter(
      ({ path, value }) => path !== 'settings.burmeseLabel' && MYANMAR_SCRIPT_REGEX.test(value)
    );
    expect(offending).toEqual([]);
  });

  it('never uses legacy bilingual "Bur · Eng" separator across UI translations', () => {
    for (const lang of ['my', 'en'] as const) {
      const entries = collectStrings(TRANSLATIONS[lang]);
      const mixed = entries.filter(({ value }) => value.includes('·'));
      expect(mixed).toEqual([]);
    }
  });

  it('preserves user-created custom categories verbatim regardless of active language', () => {
    const customCat = { name: 'Side Hustle / မုန့်ဖိုး', nameMy: 'Ignored', isDefault: false };
    expect(getCategoryLabel(customCat, 'my')).toBe('Side Hustle / မုန့်ဖိုး');
    expect(getCategoryLabel(customCat, 'en')).toBe('Side Hustle / မုန့်ဖိုး');

    const defaultCat = { name: 'Food & Dining', nameMy: 'အစားအသောက်', isDefault: true };
    expect(getCategoryLabel(defaultCat, 'my')).toBe('အစားအသောက်');
    expect(getCategoryLabel(defaultCat, 'en')).toBe('Food & Dining');

    const csvCustomBreakdown = { name: 'Coffee Shop', nameMy: null };
    expect(getCategoryLabel(csvCustomBreakdown, 'my')).toBe('Coffee Shop');
    expect(getCategoryLabel(csvCustomBreakdown, 'en')).toBe('Coffee Shop');
  });

  it('localizes payment methods, transaction types, and dates strictly per language', () => {
    expect(getPaymentMethodLabel('Cash', 'my')).toBe('ငွေသား');
    expect(getPaymentMethodLabel('Cash', 'en')).toBe('Cash');
    expect(getTypeLabel('income', 'my')).toBe('ဝင်ငွေ');
    expect(getTypeLabel('expense', 'en')).toBe('Expense');

    expect(formatLocalizedShortDate('2026-11-21', 'my')).toBe('နို 21');
    expect(formatLocalizedFullDate('2026-11-21', 'my')).toBe('နိုဝင်ဘာ 21, 2026');
    expect(formatLocalizedShortDate('2026-11-21', 'en')).toBe('Nov 21');
    expect(formatLocalizedFullDate('2026-11-21', 'en')).toBe('Nov 21, 2026');
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

  it('persists and reads theme, language, sidebar state, and currency safely', () => {
    installMockWindow(false);

    expect(getSavedThemePreference()).toBe('light');
    saveThemePreference('dark');
    expect(getSavedThemePreference()).toBe('dark');

    expect(getSavedLanguagePreference()).toBe('my');
    saveLanguagePreference('en');
    expect(getSavedLanguagePreference()).toBe('en');

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
