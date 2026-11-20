import { beforeEach, describe, expect, it } from 'vitest';
import { toLocalDateString } from '../utils/formatters';
import {
  LOCAL_CORRUPTED_PREFIX,
  LOCAL_TRANSACTIONS_KEY,
  LocalStorageAdapter,
} from './localStorageAdapter';

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  };
}

describe('LocalStorageAdapter & Ledger Business Logic', () => {
  let memoryStorage: Storage;

  beforeEach(() => {
    memoryStorage = createMemoryStorage();
    (globalThis as any).window = { localStorage: memoryStorage };
  });

  it('starts empty with default categories and empty-state summary', async () => {
    const adapter = new LocalStorageAdapter();
    const categories = await adapter.getCategories();
    const today = toLocalDateString();
    const summary = await adapter.getDashboardSummary(today, today);

    expect(categories.length).toBeGreaterThanOrEqual(12);
    expect(summary.hasAnyTransactions).toBe(false);
    expect(summary.kpis.totalIncome).toBe(0);
    expect(summary.kpis.totalExpense).toBe(0);
    expect(summary.kpis.netBalance).toBe(0);
  });

  it('creates, edits, persists across simulated refresh, and deletes transactions', async () => {
    const adapter1 = new LocalStorageAdapter();
    const today = toLocalDateString();

    const created = await adapter1.createTransaction({
      type: 'expense',
      amount: 15000,
      categoryId: 6, // Food & Dining
      transactionDate: today,
      paymentMethod: 'KBZPay',
      note: 'မနက်စာ',
    });

    expect(created.id).toBe(1);
    expect(created.amount).toBe(15000);

    // Simulate browser refresh by creating a fresh adapter instance
    const adapter2 = new LocalStorageAdapter();
    const listed = await adapter2.listTransactions({ page: 1, limit: 20 });
    expect(listed.meta.total).toBe(1);
    expect(listed.data[0].note).toBe('မနက်စာ');

    // Edit record
    const updated = await adapter2.updateTransaction(created.id, {
      amount: 22500,
      note: 'နေ့လယ်စာ',
    });
    expect(updated.amount).toBe(22500);
    expect(updated.note).toBe('နေ့လယ်စာ');

    // Delete record
    const deleted = await adapter2.deleteTransaction(created.id);
    expect(deleted.deleted).toBe(true);
    const afterDelete = await adapter2.listTransactions({ page: 1, limit: 20 });
    expect(afterDelete.meta.total).toBe(0);
  });

  it('supports search, filtering, sorting, charts summary, and UTF-8 BOM CSV export', async () => {
    const adapter = new LocalStorageAdapter();
    const today = toLocalDateString();

    await adapter.createTransaction({
      type: 'income',
      amount: 500000,
      categoryId: 1, // Salary
      transactionDate: today,
      paymentMethod: 'Bank Transfer',
      note: 'Monthly salary',
    });
    await adapter.createTransaction({
      type: 'expense',
      amount: 25000,
      categoryId: 6, // Food & Dining
      transactionDate: today,
      paymentMethod: 'KBZPay',
      note: 'ကော်ဖီနှင့် မုန့်',
    });

    const filtered = await adapter.listTransactions({
      search: 'ကော်ဖီ',
      type: 'expense',
      from: today,
      to: today,
    });
    expect(filtered.meta.total).toBe(1);
    expect(filtered.data[0].amount).toBe(25000);

    const summary = await adapter.getDashboardSummary(today, today);
    expect(summary.hasAnyTransactions).toBe(true);
    expect(summary.kpis.totalIncome).toBe(500000);
    expect(summary.kpis.totalExpense).toBe(25000);
    expect(summary.kpis.netBalance).toBe(475000);
    expect(summary.cashFlow).toHaveLength(1);
    expect(summary.categoryBreakdown.expense[0].percentage).toBe(100);

    const csv = await adapter.exportCsv({ from: today, to: today }, 'KRW');
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('KRW');
    expect(csv).toContain('ကော်ဖီနှင့် မုန့်');
  });

  it('loads sample data when empty and refuses to overwrite existing user data', async () => {
    const adapter = new LocalStorageAdapter();
    const firstSeed = await adapter.seedSampleData();
    expect(firstSeed.inserted).toBe(12);

    const secondSeed = await adapter.seedSampleData();
    expect(secondSeed.inserted).toBe(0);

    // Even with a single custom entry, sample data must not overwrite it
    const adapter2 = new LocalStorageAdapter();
    adapter2.clearAllLocalTransactions();
    await adapter2.createTransaction({
      type: 'income',
      amount: 10000,
      categoryId: 1,
      transactionDate: toLocalDateString(),
      paymentMethod: 'Cash',
      note: 'Keep me',
    });

    const guardedSeed = await adapter2.seedSampleData();
    expect(guardedSeed.inserted).toBe(0);
    const list = await adapter2.listTransactions({});
    expect(list.meta.total).toBe(1);
    expect(list.data[0].note).toBe('Keep me');
  });

  it('quarantines corrupted localStorage safely and validates backup restore', async () => {
    memoryStorage.setItem(LOCAL_TRANSACTIONS_KEY, '{not-valid-json');
    const adapter = new LocalStorageAdapter();
    const list = await adapter.listTransactions({});
    expect(list.data).toEqual([]);

    const diag = adapter.getDiagnostics();
    expect(diag.corruptedRecoveryKey).toContain(LOCAL_CORRUPTED_PREFIX);
    expect(memoryStorage.getItem(diag.corruptedRecoveryKey!)).toBe('{not-valid-json');

    await expect(
      adapter.createTransaction({
        type: 'expense',
        amount: -50,
        categoryId: 6,
        transactionDate: toLocalDateString(),
        paymentMethod: 'Cash',
      })
    ).rejects.toThrow();

    // Backup export + valid restore + invalid restore rejection
    await adapter.createTransaction({
      type: 'income',
      amount: 99000,
      categoryId: 1,
      transactionDate: toLocalDateString(),
      paymentMethod: 'Cash',
      note: 'Backup test',
    });
    const backupJson = JSON.stringify(adapter.exportBackupPayload());
    adapter.clearAllLocalTransactions();
    expect((await adapter.listTransactions({})).meta.total).toBe(0);

    const restored = adapter.importBackupJson(backupJson);
    expect(restored.restoredCount).toBe(1);
    expect((await adapter.listTransactions({})).data[0].note).toBe('Backup test');

    expect(() => adapter.importBackupJson('{"bad": true}')).toThrow();
  });

  it('handles browser storage QuotaExceededError cleanly', async () => {
    const fullStorage: Storage = {
      ...memoryStorage,
      getItem: memoryStorage.getItem,
      setItem: (key: string, value: string) => {
        if (key === LOCAL_TRANSACTIONS_KEY) {
          throw new DOMException('Quota exceeded', 'QuotaExceededError');
        }
        memoryStorage.setItem(key, value);
      },
    };
    (globalThis as any).window = { localStorage: fullStorage };

    const adapter = new LocalStorageAdapter();
    await expect(
      adapter.createTransaction({
        type: 'expense',
        amount: 5000,
        categoryId: 6,
        transactionDate: toLocalDateString(),
        paymentMethod: 'Cash',
      })
    ).rejects.toThrow(/storage is full/i);
  });
});
