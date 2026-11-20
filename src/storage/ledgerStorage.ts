import type {
  CsvImportPreview,
  CsvImportResult,
  DuplicateStrategy,
} from '../domain/csvImport';
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

export interface StorageStatus {
  mode: StorageMode;
  engine: 'indexeddb' | 'api';
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

export function getSavedCurrencyPreference(): CurrencyCode {
  try {
    if (typeof window === 'undefined') return 'MMK';
    const saved = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
    return isCurrencyCode(saved) ? saved : 'MMK';
  } catch {
    return 'MMK';
  }
}

export function saveCurrencyPreference(currency: CurrencyCode): void {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
    }
  } catch {
    // Ignore preference write errors when storage is restricted
  }
}

export function getPreferredMode(): StorageMode | null {
  try {
    if (typeof window === 'undefined') return null;
    const saved = window.localStorage.getItem(PREFERRED_MODE_KEY);
    return saved === 'api' || saved === 'local' ? saved : null;
  } catch {
    return null;
  }
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
