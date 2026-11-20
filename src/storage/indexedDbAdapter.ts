import Dexie from 'dexie';
import {
  type CsvImportPreview,
  type CsvImportResult,
  type DuplicateStrategy,
  parseAndBuildCsvImportPreview,
} from '../domain/csvImport';
import {
  buildSampleTransactionInputs,
  buildTransactionsCsv,
  computeDashboardSummary,
  DEFAULT_CATEGORIES,
  filterAndSortTransactions,
  type LedgerBackupFile,
  paginateTransactions,
  parseAndValidateBackupJson,
  validateCreateTransactionInput,
} from '../domain/ledgerLogic';
import type {
  Category,
  CreateTransactionInput,
  DashboardSummary,
  Transaction,
  TransactionFilters,
  TransactionsResponse,
  TransactionType,
} from '../types/ledger';
import type { CurrencyCode } from '../utils/formatters';
import {
  DailyLedgerDatabase,
  LEDGER_DB_NAME,
  LEDGER_DB_VERSION,
  type StoredCategoryRow,
  type StoredTransactionRow,
} from './ledgerDb';
import type { LedgerStorage } from './ledgerStorage';
import {
  LOCAL_CATEGORIES_KEY,
  LOCAL_CORRUPTED_PREFIX,
  LOCAL_NEXT_ID_KEY,
  LOCAL_TRANSACTIONS_KEY,
} from './localStorageAdapter';

const META_LEGACY_MIGRATED_KEY = 'legacy_localstorage_migrated';
const META_CORRUPTED_IDB_KEY = 'daily_ledger_idb_corrupted_quarantine';
const QUOTA_WARNING_THRESHOLD = 0.8;

export interface IndexedDbDiagnostics {
  indexedDbAvailable: boolean;
  dbVersion: number;
  persisted: boolean | null;
  usageBytes: number | null;
  quotaBytes: number | null;
  quotaPercent: number | null;
  quotaWarning: boolean;
  corruptedRecoveryKey: string | null;
  localTransactionCount: number;
  migratedFromLocalStorage: boolean;
  hasLegacyLocalStorageData: boolean;
  legacyLocalStorageCount: number;
  storageError: string | null;
}

function isQuotaError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { name?: string; inner?: { name?: string } };
  return (
    err.name === 'QuotaExceededError' ||
    err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    err.inner?.name === 'QuotaExceededError'
  );
}

function normalizeDbError(error: unknown, fallbackMessage: string): Error {
  if (isQuotaError(error)) {
    return new Error(
      'Browser IndexedDB storage quota exceeded. Please export a JSON backup and remove older entries.'
    );
  }
  if (error instanceof Error) {
    if (error.name === 'VersionError') {
      return new Error(
        'A newer database schema exists in another tab. Please reload the page to sync database version.'
      );
    }
    return error;
  }
  return new Error(fallbackMessage);
}

export class IndexedDbStorageAdapter implements LedgerStorage {
  readonly mode = 'local' as const;
  private readonly db: DailyLedgerDatabase;
  private initPromise: Promise<void> | null = null;
  private persistAttempted = false;
  private persistedStatus: boolean | null = null;
  private corruptedRecoveryKey: string | null = null;
  private migratedInThisDb = false;
  private storageError: string | null = null;

  constructor(dbName: string = LEDGER_DB_NAME) {
    this.db = new DailyLedgerDatabase(dbName);
  }

  isIndexedDbAvailable(): boolean {
    return typeof indexedDB !== 'undefined';
  }

  private getBrowserLocalStorage(): Storage | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage;
      }
      return null;
    } catch {
      return null;
    }
  }

  private readLegacyLocalStorage(): {
    categories: Category[];
    transactions: StoredTransactionRow[];
    hasLegacyData: boolean;
    count: number;
  } {
    const ls = this.getBrowserLocalStorage();
    if (!ls) {
      return { categories: [], transactions: [], hasLegacyData: false, count: 0 };
    }

    let rawCats: string | null = null;
    let rawTxs: string | null = null;
    try {
      rawCats = ls.getItem(LOCAL_CATEGORIES_KEY);
      rawTxs = ls.getItem(LOCAL_TRANSACTIONS_KEY);
    } catch {
      return { categories: [], transactions: [], hasLegacyData: false, count: 0 };
    }

    let categories: Category[] = DEFAULT_CATEGORIES;
    if (rawCats) {
      try {
        const parsedCats = JSON.parse(rawCats);
        if (Array.isArray(parsedCats) && parsedCats.length > 0) {
          categories = parsedCats.filter(
            (c): c is Category =>
              Boolean(
                c &&
                  typeof c === 'object' &&
                  typeof c.id === 'number' &&
                  typeof c.name === 'string' &&
                  (c.type === 'income' || c.type === 'expense')
              )
          );
        }
      } catch {
        // Ignore corrupted legacy categories during inspection
      }
    }

    const catIds = new Set(categories.map((c) => c.id));
    let transactions: StoredTransactionRow[] = [];
    if (rawTxs) {
      try {
        const parsedTxs = JSON.parse(rawTxs);
        if (Array.isArray(parsedTxs)) {
          transactions = parsedTxs
            .filter(
              (tx): tx is Transaction =>
                Boolean(
                  tx &&
                    typeof tx === 'object' &&
                    typeof tx.id === 'number' &&
                    (tx.type === 'income' || tx.type === 'expense') &&
                    typeof tx.amount === 'number' &&
                    Number.isFinite(tx.amount) &&
                    tx.amount > 0 &&
                    typeof tx.transactionDate === 'string' &&
                    catIds.has(tx.categoryId)
                )
            )
            .map((tx) => ({
              id: tx.id,
              type: tx.type,
              amount: Number(tx.amount.toFixed(2)),
              categoryId: tx.categoryId,
              transactionDate: tx.transactionDate,
              paymentMethod: tx.paymentMethod || 'Cash',
              note: tx.note ?? null,
              createdAt: tx.createdAt || new Date().toISOString(),
              updatedAt: tx.updatedAt || new Date().toISOString(),
              syncStatus: 'local_only',
              remoteId: null,
            }));
        }
      } catch {
        // Ignore malformed legacy transactions safely
      }
    }

    return {
      categories,
      transactions,
      hasLegacyData: Boolean(rawTxs && transactions.length > 0),
      count: transactions.length,
    };
  }

  private async requestPersistentStorageOnce(): Promise<void> {
    if (this.persistAttempted) return;
    this.persistAttempted = true;

    try {
      if (typeof navigator === 'undefined' || !navigator.storage) {
        this.persistedStatus = null;
        return;
      }

      if (typeof navigator.storage.persisted === 'function') {
        const alreadyPersisted = await navigator.storage.persisted();
        if (alreadyPersisted) {
          this.persistedStatus = true;
          return;
        }
      }

      if (typeof navigator.storage.persist === 'function') {
        this.persistedStatus = await navigator.storage.persist();
      } else {
        this.persistedStatus = null;
      }
    } catch {
      this.persistedStatus = null;
    }
  }

  async ensureInitialized(): Promise<void> {
    if (!this.isIndexedDbAvailable()) {
      const msg =
        'IndexedDB is not supported or is blocked in this browser session (e.g. Private Browsing).';
      this.storageError = msg;
      throw new Error(msg);
    }

    if (!this.initPromise) {
      this.initPromise = (async () => {
        try {
          if (!this.db.isOpen()) {
            await this.db.open();
          }

          await this.requestPersistentStorageOnce();

          await this.db.transaction(
            'rw',
            this.db.categories,
            this.db.transactions,
            this.db.meta,
            async () => {
              const catCount = await this.db.categories.count();
              const txCount = await this.db.transactions.count();
              const migratedMeta = await this.db.meta.get(META_LEGACY_MIGRATED_KEY);

              if (migratedMeta?.value) {
                this.migratedInThisDb = true;
              }

              // Safe, non-destructive migration from legacy localStorage if IndexedDB has 0 transactions
              const legacy = this.readLegacyLocalStorage();
              if (txCount === 0 && !migratedMeta && legacy.hasLegacyData) {
                if (catCount === 0) {
                  await this.db.categories.bulkPut(
                    legacy.categories.map((c) => ({
                      id: c.id,
                      name: c.name,
                      nameMy: c.nameMy,
                      type: c.type,
                      icon: c.icon,
                      color: c.color,
                      isDefault: Boolean(c.isDefault),
                    }))
                  );
                } else {
                  // Merge any custom legacy categories without clobbering existing categories
                  for (const c of legacy.categories) {
                    const existing = await this.db.categories.get(c.id);
                    if (!existing) {
                      await this.db.categories.put({
                        id: c.id,
                        name: c.name,
                        nameMy: c.nameMy,
                        type: c.type,
                        icon: c.icon,
                        color: c.color,
                        isDefault: Boolean(c.isDefault),
                      });
                    }
                  }
                }

                await this.db.transactions.bulkPut(legacy.transactions);
                await this.db.meta.put({
                  key: META_LEGACY_MIGRATED_KEY,
                  value: {
                    migratedAt: new Date().toISOString(),
                    migratedCount: legacy.transactions.length,
                  },
                  updatedAt: new Date().toISOString(),
                });
                this.migratedInThisDb = true;
                return;
              }

              if (catCount === 0) {
                await this.db.categories.bulkPut(
                  DEFAULT_CATEGORIES.map((c) => ({
                    id: c.id,
                    name: c.name,
                    nameMy: c.nameMy,
                    type: c.type,
                    icon: c.icon,
                    color: c.color,
                    isDefault: Boolean(c.isDefault),
                  }))
                );
              }
            }
          );

          this.storageError = null;
        } catch (error) {
          const normalized = normalizeDbError(error, 'Failed to initialize IndexedDB storage.');
          this.storageError = normalized.message;
          throw normalized;
        }
      })();
    }

    try {
      await this.initPromise;
    } catch (error) {
      this.initPromise = null;
      throw error;
    }
  }

  private quarantineCorruptedRows(rows: unknown[]): void {
    try {
      const ls = this.getBrowserLocalStorage();
      const key = `${LOCAL_CORRUPTED_PREFIX}idb_${Date.now()}`;
      if (ls) {
        ls.setItem(key, JSON.stringify(rows));
      }
      this.corruptedRecoveryKey = key;
    } catch {
      this.corruptedRecoveryKey = META_CORRUPTED_IDB_KEY;
    }
  }

  private async loadValidState(): Promise<{ categories: Category[]; transactions: Transaction[] }> {
    await this.ensureInitialized();

    const rawCategories = await this.db.categories.toArray();
    const categories: Category[] = rawCategories
      .filter((c): c is Category & { id: number } => typeof c.id === 'number')
      .map((c) => ({
        id: c.id,
        name: c.name,
        nameMy: c.nameMy ?? null,
        type: c.type,
        icon: c.icon || 'tag',
        color: c.color || '#2196F3',
        isDefault: Boolean(c.isDefault),
      }));

    const catMap = new Map(categories.map((c) => [c.id, c]));
    const rawTransactions = await this.db.transactions.toArray();

    const validTransactions: Transaction[] = [];
    const invalidRows: StoredTransactionRow[] = [];

    for (const row of rawTransactions) {
      const cat = typeof row.categoryId === 'number' ? catMap.get(row.categoryId) : undefined;
      if (
        typeof row.id === 'number' &&
        (row.type === 'income' || row.type === 'expense') &&
        typeof row.amount === 'number' &&
        Number.isFinite(row.amount) &&
        row.amount > 0 &&
        typeof row.transactionDate === 'string' &&
        cat &&
        cat.type === row.type
      ) {
        validTransactions.push({
          id: row.id,
          type: row.type,
          amount: Number(row.amount.toFixed(2)),
          categoryId: row.categoryId,
          transactionDate: row.transactionDate,
          paymentMethod: row.paymentMethod || 'Cash',
          note: row.note ?? null,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          category: cat,
        });
      } else {
        invalidRows.push(row);
      }
    }

    if (invalidRows.length > 0) {
      this.quarantineCorruptedRows(invalidRows);
    }

    return { categories, transactions: validTransactions };
  }

  async getDiagnostics(): Promise<IndexedDbDiagnostics> {
    const legacy = this.readLegacyLocalStorage();
    let localTransactionCount = 0;

    if (this.isIndexedDbAvailable()) {
      try {
        await this.ensureInitialized();
        localTransactionCount = await this.db.transactions.count();
      } catch {
        localTransactionCount = 0;
      }
    }

    let usageBytes: number | null = null;
    let quotaBytes: number | null = null;
    let quotaPercent: number | null = null;
    let quotaWarning = false;

    try {
      if (
        typeof navigator !== 'undefined' &&
        navigator.storage &&
        typeof navigator.storage.estimate === 'function'
      ) {
        const estimate = await navigator.storage.estimate();
        if (typeof estimate.usage === 'number') usageBytes = estimate.usage;
        if (typeof estimate.quota === 'number' && estimate.quota > 0) {
          quotaBytes = estimate.quota;
          if (usageBytes !== null) {
            const ratio = usageBytes / quotaBytes;
            quotaPercent = Number((ratio * 100).toFixed(2));
            quotaWarning = ratio >= QUOTA_WARNING_THRESHOLD;
          }
        }
      }
    } catch {
      // Safari / restricted contexts may omit or reject estimate()
    }

    return {
      indexedDbAvailable: this.isIndexedDbAvailable(),
      dbVersion: LEDGER_DB_VERSION,
      persisted: this.persistedStatus,
      usageBytes,
      quotaBytes,
      quotaPercent,
      quotaWarning,
      corruptedRecoveryKey: this.corruptedRecoveryKey,
      localTransactionCount,
      migratedFromLocalStorage: this.migratedInThisDb,
      hasLegacyLocalStorageData: legacy.hasLegacyData,
      legacyLocalStorageCount: legacy.count,
      storageError: this.storageError,
    };
  }

  dismissCorruptedNotice(): void {
    this.corruptedRecoveryKey = null;
  }

  clearLegacyLocalStorageData(): void {
    const ls = this.getBrowserLocalStorage();
    if (!ls) return;
    try {
      ls.removeItem(LOCAL_CATEGORIES_KEY);
      ls.removeItem(LOCAL_TRANSACTIONS_KEY);
      ls.removeItem(LOCAL_NEXT_ID_KEY);
    } catch {
      throw new Error('Unable to clear legacy localStorage entries.');
    }
  }

  async getCategories(type?: TransactionType): Promise<Category[]> {
    const { categories } = await this.loadValidState();
    return type ? categories.filter((c) => c.type === type) : categories;
  }

  async getDashboardSummary(from: string, to: string): Promise<DashboardSummary> {
    const { transactions } = await this.loadValidState();
    return computeDashboardSummary(transactions, from, to);
  }

  async listTransactions(filters: TransactionFilters): Promise<TransactionsResponse> {
    const { transactions } = await this.loadValidState();
    const sorted = filterAndSortTransactions(transactions, filters);
    return paginateTransactions(sorted, filters.page ?? 1, filters.limit ?? 20);
  }

  async createTransaction(input: CreateTransactionInput): Promise<Transaction> {
    try {
      const { categories } = await this.loadValidState();
      const valid = validateCreateTransactionInput(input, categories);
      const category = categories.find((c) => c.id === valid.categoryId)!;
      const nowIso = new Date().toISOString();

      const row: StoredTransactionRow = {
        type: valid.type,
        amount: valid.amount,
        categoryId: valid.categoryId,
        transactionDate: valid.transactionDate,
        paymentMethod: valid.paymentMethod,
        note: valid.note ?? null,
        createdAt: nowIso,
        updatedAt: nowIso,
        syncStatus: 'local_only',
        remoteId: null,
      };

      const id = await this.db.transactions.add(row);
      return {
        id: Number(id),
        type: row.type,
        amount: row.amount,
        categoryId: row.categoryId,
        transactionDate: row.transactionDate,
        paymentMethod: row.paymentMethod,
        note: row.note,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        category,
      };
    } catch (error) {
      throw normalizeDbError(error, 'Unable to save entry to IndexedDB.');
    }
  }

  async updateTransaction(
    id: number,
    input: Partial<CreateTransactionInput>
  ): Promise<Transaction> {
    try {
      const { categories } = await this.loadValidState();
      const existing = await this.db.transactions.get(id);
      if (!existing) {
        throw new Error('Transaction not found');
      }

      const merged: CreateTransactionInput = {
        type: input.type ?? existing.type,
        amount: input.amount ?? existing.amount,
        categoryId: input.categoryId ?? existing.categoryId,
        transactionDate: input.transactionDate ?? existing.transactionDate,
        paymentMethod: input.paymentMethod ?? existing.paymentMethod,
        note: input.note !== undefined ? input.note : existing.note,
      };

      const valid = validateCreateTransactionInput(merged, categories);
      const category = categories.find((c) => c.id === valid.categoryId)!;
      const updatedAt = new Date().toISOString();

      await this.db.transactions.update(id, {
        type: valid.type,
        amount: valid.amount,
        categoryId: valid.categoryId,
        transactionDate: valid.transactionDate,
        paymentMethod: valid.paymentMethod,
        note: valid.note ?? null,
        updatedAt,
        syncStatus: existing.remoteId ? 'pending_sync' : 'local_only',
      });

      return {
        id,
        type: valid.type,
        amount: valid.amount,
        categoryId: valid.categoryId,
        transactionDate: valid.transactionDate,
        paymentMethod: valid.paymentMethod,
        note: valid.note ?? null,
        createdAt: existing.createdAt,
        updatedAt,
        category,
      };
    } catch (error) {
      throw normalizeDbError(error, 'Unable to update entry in IndexedDB.');
    }
  }

  async deleteTransaction(id: number): Promise<{ id: number; deleted: boolean }> {
    try {
      await this.ensureInitialized();
      const existing = await this.db.transactions.get(id);
      if (!existing) {
        throw new Error('Transaction not found');
      }
      await this.db.transactions.delete(id);
      return { id, deleted: true };
    } catch (error) {
      throw normalizeDbError(error, 'Unable to delete entry from IndexedDB.');
    }
  }

  async seedSampleData(): Promise<{ inserted: number; message: string }> {
    try {
      const { categories } = await this.loadValidState();

      return await this.db.transaction('rw', this.db.transactions, async () => {
        const existingCount = await this.db.transactions.count();
        // Never overwrite or append sample data over existing user records
        if (existingCount > 0) {
          return {
            inserted: 0,
            message:
              'Existing ledger entries detected; sample data was skipped to protect your data.',
          };
        }

        const blueprints = buildSampleTransactionInputs(categories);
        const nowIso = new Date().toISOString();
        const rows: StoredTransactionRow[] = blueprints.map((bp) => ({
          type: bp.type,
          amount: bp.amount,
          categoryId: bp.categoryId,
          transactionDate: bp.transactionDate,
          paymentMethod: bp.paymentMethod,
          note: bp.note ?? null,
          createdAt: nowIso,
          updatedAt: nowIso,
          syncStatus: 'local_only',
          remoteId: null,
        }));

        await this.db.transactions.bulkAdd(rows);
        return {
          inserted: rows.length,
          message: 'Sample transactions added to IndexedDB.',
        };
      });
    } catch (error) {
      throw normalizeDbError(error, 'Unable to load sample data.');
    }
  }

  async exportCsv(filters: TransactionFilters, currency: CurrencyCode): Promise<string> {
    const { transactions } = await this.loadValidState();
    const sorted = filterAndSortTransactions(transactions, filters);
    return buildTransactionsCsv(sorted, currency);
  }

  async previewCsvImport(rawCsvText: string): Promise<CsvImportPreview> {
    const { categories, transactions } = await this.loadValidState();
    return parseAndBuildCsvImportPreview(rawCsvText, categories, transactions);
  }

  async executeCsvImport(
    preview: CsvImportPreview,
    strategy: DuplicateStrategy
  ): Promise<CsvImportResult> {
    if (preview.headerError) {
      throw new Error(preview.headerError);
    }

    try {
      await this.ensureInitialized();

      return await this.db.transaction(
        'rw',
        this.db.categories,
        this.db.transactions,
        this.db.meta,
        async () => {
          const currentCats = await this.db.categories.toArray();
          const currentTxs = await this.db.transactions.toArray();
          const usedIds = new Set(
            currentTxs.map((t) => t.id).filter((id): id is number => typeof id === 'number')
          );

          const insertedByFingerprint = new Map<string, number>();
          let insertedCount = 0;
          let updatedCount = 0;
          let skippedCount = 0;
          let invalidCount = 0;
          let createdCategoriesCount = 0;

          const resolveCategoryId = async (
            type: 'income' | 'expense',
            categoryName: string,
            categoryNameMy: string | null
          ): Promise<number> => {
            const found = currentCats.find(
              (c) =>
                c.type === type &&
                (c.name.toLowerCase() === categoryName.toLowerCase() ||
                  (categoryNameMy && c.nameMy && c.nameMy.trim() === categoryNameMy.trim()))
            );
            if (found && typeof found.id === 'number') {
              return found.id;
            }

            const newCat: StoredCategoryRow = {
              name: categoryName,
              nameMy: categoryNameMy,
              type,
              icon: 'tag',
              color: type === 'income' ? '#2196F3' : '#1565C0',
              isDefault: false,
            };
            const newId = Number(await this.db.categories.add(newCat));
            currentCats.push({ ...newCat, id: newId });
            createdCategoriesCount += 1;
            return newId;
          };

          const nowIso = new Date().toISOString();

          for (const row of preview.rows) {
            if (row.status === 'invalid' || !row.parsed) {
              invalidCount += 1;
              continue;
            }

            const parsed = row.parsed;
            const categoryId = await resolveCategoryId(
              parsed.type,
              parsed.categoryName,
              parsed.categoryNameMy
            );
            const fp = [
              parsed.transactionDate,
              parsed.type,
              parsed.categoryName.trim().toLowerCase(),
              parsed.amount.toFixed(2),
              parsed.paymentMethod.trim().toLowerCase(),
              (parsed.note ?? '').trim(),
            ].join('|');

            if (row.status === 'duplicate') {
              if (strategy === 'skip') {
                skippedCount += 1;
                continue;
              }

              if (strategy === 'update') {
                const targetId =
                  (parsed.id !== null && usedIds.has(parsed.id) ? parsed.id : undefined) ??
                  row.matchedExistingId ??
                  insertedByFingerprint.get(fp);

                if (targetId !== undefined && usedIds.has(targetId)) {
                  const existing = await this.db.transactions.get(targetId);
                  await this.db.transactions.update(targetId, {
                    type: parsed.type,
                    amount: parsed.amount,
                    categoryId,
                    transactionDate: parsed.transactionDate,
                    paymentMethod: parsed.paymentMethod,
                    note: parsed.note,
                    updatedAt: parsed.updatedAt ?? nowIso,
                    syncStatus: existing?.remoteId ? 'pending_sync' : 'local_only',
                  });
                  updatedCount += 1;
                  continue;
                }
              }
            }

            // Insert new record (preserve ID when non-colliding and not forcing import_as_new duplicate)
            const canPreserveId =
              parsed.id !== null &&
              !usedIds.has(parsed.id) &&
              !(row.status === 'duplicate' && strategy === 'import_as_new');

            const newRow: StoredTransactionRow = {
              ...(canPreserveId ? { id: parsed.id! } : {}),
              type: parsed.type,
              amount: parsed.amount,
              categoryId,
              transactionDate: parsed.transactionDate,
              paymentMethod: parsed.paymentMethod,
              note: parsed.note,
              createdAt: parsed.createdAt ?? nowIso,
              updatedAt: parsed.updatedAt ?? parsed.createdAt ?? nowIso,
              syncStatus: 'local_only',
              remoteId: null,
            };

            const assignedId = Number(await this.db.transactions.add(newRow));
            usedIds.add(assignedId);
            insertedByFingerprint.set(fp, assignedId);
            insertedCount += 1;
          }

          await this.db.meta.put({
            key: 'last_csv_import',
            value: {
              importedAt: nowIso,
              strategy,
              insertedCount,
              updatedCount,
              skippedCount,
              invalidCount,
            },
            updatedAt: nowIso,
          });

          return {
            insertedCount,
            updatedCount,
            skippedCount,
            invalidCount,
            createdCategoriesCount,
          };
        }
      );
    } catch (error) {
      throw normalizeDbError(error, 'CSV import failed and was rolled back.');
    }
  }

  async exportBackupPayload(): Promise<LedgerBackupFile> {
    const { categories, transactions } = await this.loadValidState();
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      categories,
      transactions,
    };
  }

  async importBackupJson(rawText: string): Promise<{ restoredCount: number }> {
    const backup = parseAndValidateBackupJson(rawText);

    try {
      await this.ensureInitialized();

      await this.db.transaction(
        'rw',
        this.db.categories,
        this.db.transactions,
        this.db.meta,
        async () => {
          await this.db.categories.clear();
          await this.db.transactions.clear();

          const catRows: StoredCategoryRow[] = backup.categories.map((c) => ({
            id: c.id,
            name: c.name,
            nameMy: c.nameMy,
            type: c.type,
            icon: c.icon,
            color: c.color,
            isDefault: Boolean(c.isDefault),
          }));
          await this.db.categories.bulkPut(catRows);

          const txRows: StoredTransactionRow[] = backup.transactions.map((t) => ({
            id: t.id,
            type: t.type,
            amount: t.amount,
            categoryId: t.categoryId,
            transactionDate: t.transactionDate,
            paymentMethod: t.paymentMethod,
            note: t.note,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
            syncStatus: 'local_only',
            remoteId: null,
          }));
          await this.db.transactions.bulkPut(txRows);

          await this.db.meta.put({
            key: 'last_restored_at',
            value: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      );

      return { restoredCount: backup.transactions.length };
    } catch (error) {
      throw normalizeDbError(error, 'Unable to restore backup into IndexedDB.');
    }
  }

  async clearAllTransactions(): Promise<void> {
    await this.ensureInitialized();
    await this.db.transactions.clear();
  }

  async close(): Promise<void> {
    await Dexie.waitFor(Promise.resolve());
    this.db.close();
  }
}
