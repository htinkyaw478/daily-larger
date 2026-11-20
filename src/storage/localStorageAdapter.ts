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
import type { LedgerStorage } from './ledgerStorage';

export const LOCAL_CATEGORIES_KEY = 'daily_ledger_v1_categories';
export const LOCAL_TRANSACTIONS_KEY = 'daily_ledger_v1_transactions';
export const LOCAL_NEXT_ID_KEY = 'daily_ledger_v1_next_id';
export const LOCAL_CORRUPTED_PREFIX = 'daily_ledger_v1_corrupted_backup_';

interface LocalState {
  categories: Category[];
  transactions: Transaction[];
  nextId: number;
}

export class LocalStorageAdapter implements LedgerStorage {
  readonly mode = 'local' as const;
  private corruptedRecoveryKey: string | null = null;

  private getStorage(): Storage {
    if (typeof window === 'undefined' || !window.localStorage) {
      throw new Error('Browser localStorage is unavailable in this environment.');
    }
    return window.localStorage;
  }

  private safeWrite(key: string, value: string): void {
    const storage = this.getStorage();
    try {
      storage.setItem(key, value);
    } catch (error) {
      if (
        error instanceof DOMException &&
        (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
      ) {
        throw new Error(
          'Browser storage is full. Please export a backup and remove old entries before saving more.'
        );
      }
      throw new Error('Unable to save data to browser localStorage.');
    }
  }

  private quarantineCorruptedRaw(label: string, raw: string): void {
    try {
      const storage = this.getStorage();
      const backupKey = `${LOCAL_CORRUPTED_PREFIX}${label}_${Date.now()}`;
      storage.setItem(backupKey, raw);
      this.corruptedRecoveryKey = backupKey;
    } catch {
      // Best-effort quarantine if quota allows
    }
  }

  private loadState(): LocalState {
    const storage = this.getStorage();

    // Load categories safely
    let categories: Category[] = DEFAULT_CATEGORIES;
    const rawCats = storage.getItem(LOCAL_CATEGORIES_KEY);
    if (rawCats !== null) {
      try {
        const parsed = JSON.parse(rawCats);
        if (Array.isArray(parsed) && parsed.length > 0) {
          categories = parsed;
        } else {
          this.quarantineCorruptedRaw('categories', rawCats);
        }
      } catch {
        this.quarantineCorruptedRaw('categories', rawCats);
      }
    } else {
      this.safeWrite(LOCAL_CATEGORIES_KEY, JSON.stringify(DEFAULT_CATEGORIES));
    }

    // Load transactions safely
    let transactions: Transaction[] = [];
    const rawTxs = storage.getItem(LOCAL_TRANSACTIONS_KEY);
    if (rawTxs !== null) {
      try {
        const parsed = JSON.parse(rawTxs);
        if (Array.isArray(parsed)) {
          const catMap = new Map(categories.map((c) => [c.id, c]));
          transactions = parsed.filter(
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
                  catMap.has(tx.categoryId)
              )
          ).map((tx) => ({
            ...tx,
            category: catMap.get(tx.categoryId)!,
          }));
          if (transactions.length !== parsed.length) {
            this.quarantineCorruptedRaw('transactions_partial', rawTxs);
          }
        } else {
          this.quarantineCorruptedRaw('transactions', rawTxs);
        }
      } catch {
        this.quarantineCorruptedRaw('transactions', rawTxs);
      }
    }

    const maxExistingId = transactions.reduce((max, tx) => Math.max(max, tx.id), 0);
    const rawNextId = Number(storage.getItem(LOCAL_NEXT_ID_KEY) ?? '1');
    const nextId = Number.isInteger(rawNextId) && rawNextId > maxExistingId ? rawNextId : maxExistingId + 1;

    return { categories, transactions, nextId };
  }

  private saveTransactions(transactions: Transaction[], nextId: number): void {
    this.safeWrite(LOCAL_TRANSACTIONS_KEY, JSON.stringify(transactions));
    this.safeWrite(LOCAL_NEXT_ID_KEY, String(nextId));
  }

  getDiagnostics(): { corruptedRecoveryKey: string | null; localTransactionCount: number } {
    try {
      const state = this.loadState();
      return {
        corruptedRecoveryKey: this.corruptedRecoveryKey,
        localTransactionCount: state.transactions.length,
      };
    } catch {
      return {
        corruptedRecoveryKey: this.corruptedRecoveryKey,
        localTransactionCount: 0,
      };
    }
  }

  dismissCorruptedNotice(): void {
    this.corruptedRecoveryKey = null;
  }

  async getCategories(type?: TransactionType): Promise<Category[]> {
    const { categories } = this.loadState();
    return type ? categories.filter((c) => c.type === type) : categories;
  }

  async getDashboardSummary(from: string, to: string): Promise<DashboardSummary> {
    const { transactions } = this.loadState();
    return computeDashboardSummary(transactions, from, to);
  }

  async listTransactions(filters: TransactionFilters): Promise<TransactionsResponse> {
    const { transactions } = this.loadState();
    const sorted = filterAndSortTransactions(transactions, filters);
    return paginateTransactions(sorted, filters.page ?? 1, filters.limit ?? 20);
  }

  async createTransaction(input: CreateTransactionInput): Promise<Transaction> {
    const state = this.loadState();
    const valid = validateCreateTransactionInput(input, state.categories);
    const category = state.categories.find((c) => c.id === valid.categoryId)!;
    const nowIso = new Date().toISOString();

    const created: Transaction = {
      id: state.nextId,
      type: valid.type,
      amount: valid.amount,
      categoryId: valid.categoryId,
      transactionDate: valid.transactionDate,
      paymentMethod: valid.paymentMethod,
      note: valid.note ?? null,
      createdAt: nowIso,
      updatedAt: nowIso,
      category,
    };

    const nextTransactions = [created, ...state.transactions];
    this.saveTransactions(nextTransactions, state.nextId + 1);
    return created;
  }

  async updateTransaction(
    id: number,
    input: Partial<CreateTransactionInput>
  ): Promise<Transaction> {
    const state = this.loadState();
    const idx = state.transactions.findIndex((tx) => tx.id === id);
    if (idx === -1) {
      throw new Error('Transaction not found');
    }

    const existing = state.transactions[idx];
    const merged: CreateTransactionInput = {
      type: input.type ?? existing.type,
      amount: input.amount ?? existing.amount,
      categoryId: input.categoryId ?? existing.categoryId,
      transactionDate: input.transactionDate ?? existing.transactionDate,
      paymentMethod: input.paymentMethod ?? existing.paymentMethod,
      note: input.note !== undefined ? input.note : existing.note,
    };

    const valid = validateCreateTransactionInput(merged, state.categories);
    const category = state.categories.find((c) => c.id === valid.categoryId)!;

    const updated: Transaction = {
      ...existing,
      type: valid.type,
      amount: valid.amount,
      categoryId: valid.categoryId,
      transactionDate: valid.transactionDate,
      paymentMethod: valid.paymentMethod,
      note: valid.note ?? null,
      updatedAt: new Date().toISOString(),
      category,
    };

    const nextTransactions = [...state.transactions];
    nextTransactions[idx] = updated;
    this.saveTransactions(nextTransactions, state.nextId);
    return updated;
  }

  async deleteTransaction(id: number): Promise<{ id: number; deleted: boolean }> {
    const state = this.loadState();
    const exists = state.transactions.some((tx) => tx.id === id);
    if (!exists) {
      throw new Error('Transaction not found');
    }
    const nextTransactions = state.transactions.filter((tx) => tx.id !== id);
    this.saveTransactions(nextTransactions, state.nextId);
    return { id, deleted: true };
  }

  async seedSampleData(): Promise<{ inserted: number; message: string }> {
    const state = this.loadState();
    // Never overwrite or append sample data over existing user records
    if (state.transactions.length > 0) {
      return {
        inserted: 0,
        message: 'Existing ledger entries detected; sample data was skipped to protect your data.',
      };
    }

    const blueprints = buildSampleTransactionInputs(state.categories);
    const nowIso = new Date().toISOString();
    let nextId = state.nextId;

    const created: Transaction[] = blueprints.map((bp) => {
      const category = state.categories.find((c) => c.id === bp.categoryId)!;
      const tx: Transaction = {
        id: nextId++,
        type: bp.type,
        amount: bp.amount,
        categoryId: bp.categoryId,
        transactionDate: bp.transactionDate,
        paymentMethod: bp.paymentMethod,
        note: bp.note ?? null,
        createdAt: nowIso,
        updatedAt: nowIso,
        category,
      };
      return tx;
    });

    this.saveTransactions(created, nextId);
    return { inserted: created.length, message: 'Sample transactions added to local storage.' };
  }

  async exportCsv(filters: TransactionFilters, currency: CurrencyCode): Promise<string> {
    const { transactions } = this.loadState();
    const sorted = filterAndSortTransactions(transactions, filters);
    return buildTransactionsCsv(sorted, currency);
  }

  async previewCsvImport(rawCsvText: string): Promise<CsvImportPreview> {
    const state = this.loadState();
    return parseAndBuildCsvImportPreview(rawCsvText, state.categories, state.transactions);
  }

  async executeCsvImport(
    preview: CsvImportPreview,
    strategy: DuplicateStrategy
  ): Promise<CsvImportResult> {
    if (preview.headerError) {
      throw new Error(preview.headerError);
    }

    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let invalidCount = 0;

    for (const row of preview.rows) {
      if (row.status === 'invalid' || !row.parsed) {
        invalidCount += 1;
        continue;
      }
      if (row.status === 'duplicate') {
        if (strategy === 'skip') {
          skippedCount += 1;
          continue;
        }
        if (strategy === 'update' && row.matchedExistingId && row.parsed.matchedCategoryId) {
          await this.updateTransaction(row.matchedExistingId, {
            type: row.parsed.type,
            amount: row.parsed.amount,
            categoryId: row.parsed.matchedCategoryId,
            transactionDate: row.parsed.transactionDate,
            paymentMethod: row.parsed.paymentMethod,
            note: row.parsed.note,
          });
          updatedCount += 1;
          continue;
        }
      }
      if (row.parsed.matchedCategoryId) {
        await this.createTransaction({
          type: row.parsed.type,
          amount: row.parsed.amount,
          categoryId: row.parsed.matchedCategoryId,
          transactionDate: row.parsed.transactionDate,
          paymentMethod: row.parsed.paymentMethod,
          note: row.parsed.note,
        });
        insertedCount += 1;
      }
    }

    return {
      insertedCount,
      updatedCount,
      skippedCount,
      invalidCount,
      createdCategoriesCount: 0,
    };
  }

  exportBackupPayload(): LedgerBackupFile {
    const state = this.loadState();
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      categories: state.categories,
      transactions: state.transactions,
    };
  }

  importBackupJson(rawText: string): { restoredCount: number } {
    const backup = parseAndValidateBackupJson(rawText);
    const maxId = backup.transactions.reduce((max, tx) => Math.max(max, tx.id), 0);
    this.safeWrite(LOCAL_CATEGORIES_KEY, JSON.stringify(backup.categories));
    this.saveTransactions(backup.transactions, maxId + 1);
    return { restoredCount: backup.transactions.length };
  }

  clearAllLocalTransactions(): void {
    const state = this.loadState();
    this.saveTransactions([], state.nextId);
  }
}
