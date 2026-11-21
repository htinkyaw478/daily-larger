import type {
  CsvImportPreview,
  CsvImportResult,
  DuplicateStrategy,
} from '../domain/csvImport';
import type { LanguageCode } from '../i18n/translations';
import type {
  Category,
  CreateTransactionInput,
  DashboardSummary,
  Transaction,
  TransactionFilters,
  TransactionsResponse,
  TransactionType,
} from '../types/ledger';
import { isCurrencyCode, type CurrencyCode } from '../utils/formatters';

export type StorageMode = 'api' | 'local';
export type ThemeMode = 'light' | 'dark';

export interface StorageStatus {
  mode: StorageMode;
  engine: 'indexeddb' | 'localstorage' | 'api';
  reason: 'no_api_configured' | 'api_unreachable' | 'api_connected' | 'manual_local';
  apiConfigured: boolean;
  indexedDbAvailable: boolean;
  dbVersion: number;
  persisted: boolean | null;
  usageBytes: number | null;
  quotaBytes: number | null;
  quotaPercent: number | null;
  quotaWarning: boolean;
  corruptedRecoveryKey: string | null;
  hasLocalData: boolean;
  localTransactionCount: number;
  migratedFromLocalStorage: boolean;
  hasLegacyLocalStorageData: boolean;
  legacyLocalStorageCount: number;
  storageError: string | null;
}

export interface LedgerStorage {
  readonly mode: StorageMode;
  getCategories(type?: TransactionType): Promise<Category[]>;
  getDashboardSummary(from: string, to: string): Promise<DashboardSummary>;
  listTransactions(filters: TransactionFilters): Promise<TransactionsResponse>;
  createTransaction(input: CreateTransactionInput): Promise<Transaction>;
  updateTransaction(id: number, input: Partial<CreateTransactionInput>): Promise<Transaction>;
  deleteTransaction(id: number): Promise<{ id: number; deleted: boolean }>;
  seedSampleData(): Promise<{ inserted: number; message: string }>;
  exportCsv(filters: TransactionFilters, currency: CurrencyCode): Promise<string>;
  previewCsvImport(rawCsvText: string): Promise<CsvImportPreview>;
  executeCsvImport(
    preview: CsvImportPreview,
    strategy: DuplicateStrategy
  ): Promise<CsvImportResult>;
}

const CURRENCY_STORAGE_KEY = 'daily_ledger_currency';
const PREFERRED_MODE_KEY = 'daily_ledger_preferred_mode';
const THEME_STORAGE_KEY = 'daily_ledger_theme';
const LANGUAGE_STORAGE_KEY = 'daily_ledger_language';
const SIDEBAR_COLLAPSED_KEY = 'daily_ledger_sidebar_collapsed';

function safeGetItem(key: string): string | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // Ignore preference write errors when storage is restricted
  }
}

export function getSavedCurrencyPreference(): CurrencyCode {
  const saved = safeGetItem(CURRENCY_STORAGE_KEY);
  return isCurrencyCode(saved) ? saved : 'MMK';
}

export function saveCurrencyPreference(currency: CurrencyCode): void {
  safeSetItem(CURRENCY_STORAGE_KEY, currency);
}

export function getPreferredMode(): StorageMode | null {
  const saved = safeGetItem(PREFERRED_MODE_KEY);
  return saved === 'api' || saved === 'local' ? saved : null;
}

export function savePreferredMode(mode: StorageMode | null): void {
  try {
    if (typeof window === 'undefined') return;
    if (mode === null) {
      window.localStorage.removeItem(PREFERRED_MODE_KEY);
    } else {
      window.localStorage.setItem(PREFERRED_MODE_KEY, mode);
    }
  } catch {
    // Ignore storage write errors
  }
}

export function getSavedThemePreference(): ThemeMode {
  const saved = safeGetItem(THEME_STORAGE_KEY);
  if (saved === 'light' || saved === 'dark') {
    return saved;
  }
  if (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  ) {
    return 'dark';
  }
  return 'light';
}

export function saveThemePreference(theme: ThemeMode): void {
  safeSetItem(THEME_STORAGE_KEY, theme);
}

export function getSavedLanguagePreference(): LanguageCode {
  const saved = safeGetItem(LANGUAGE_STORAGE_KEY);
  return saved === 'en' || saved === 'my' ? saved : 'my';
}

export function saveLanguagePreference(language: LanguageCode): void {
  safeSetItem(LANGUAGE_STORAGE_KEY, language);
}

export function getSavedSidebarCollapsed(): boolean {
  return safeGetItem(SIDEBAR_COLLAPSED_KEY) === 'true';
}

export function saveSidebarCollapsed(collapsed: boolean): void {
  safeSetItem(SIDEBAR_COLLAPSED_KEY, collapsed ? 'true' : 'false');
}
