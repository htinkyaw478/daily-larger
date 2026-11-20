import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_CATEGORIES } from '../domain/ledgerLogic';
import { toLocalDateString } from '../utils/formatters';
import { IndexedDbStorageAdapter } from './indexedDbAdapter';
import { DailyLedgerDatabase } from './ledgerDb';
import {
  LOCAL_CATEGORIES_KEY,
  LOCAL_TRANSACTIONS_KEY,
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

let testDbCounter = 0;
function nextDbName(): string {
  testDbCounter += 1;
  return `daily_ledger_test_${Date.now()}_${testDbCounter}`;
}

describe('IndexedDbStorageAdapter (Dexie)', () => {
  let memoryStorage: Storage;
  let dbName: string;
  let adaptersToClose: IndexedDbStorageAdapter[] = [];

  beforeEach(() => {
    memoryStorage = createMemoryStorage();
    dbName = nextDbName();
    adaptersToClose = [];
    vi.stubGlobal('window', { localStorage: memoryStorage });
    vi.stubGlobal('navigator', {
      storage: {
        persisted: async () => false,
        persist: async () => true,
        estimate: async () => ({ usage: 4096, quota: 1024 * 1024 * 100 }),
      },
    });
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    for (const adapter of adaptersToClose) {
      await adapter.close();
    }
    await Dexie.delete(dbName).catch(() => undefined);
  });

  it('persists CRUD records across database reopen, supports search/filters/charts/CSV', async () => {
    const adapter1 = new IndexedDbStorageAdapter(dbName);
    adaptersToClose.push(adapter1);
    const today = toLocalDateString();

    const created = await adapter1.createTransaction({
      type: 'income',
      amount: 650000,
      categoryId: 1, // Salary
      transactionDate: today,
      paymentMethod: 'Bank Transfer',
      note: 'လစာဝင်ငွေ',
    });

    await adapter1.createTransaction({
      type: 'expense',
      amount: 18500,
      categoryId: 6, // Food & Dining
      transactionDate: today,
      paymentMethod: 'KBZPay',
      note: 'နေ့လယ်စာ',
    });

    await adapter1.close();

    // Simulate page refresh / reopening IndexedDB
    const adapter2 = new IndexedDbStorageAdapter(dbName);
    adaptersToClose.push(adapter2);

    const list = await adapter2.listTransactions({ sort: 'date_desc', page: 1, limit: 20 });
    expect(list.meta.total).toBe(2);

    const updated = await adapter2.updateTransaction(created.id, {
      amount: 700000,
      note: 'လစာ + ဘောနပ်စ်',
    });
    expect(updated.amount).toBe(700000);

    const filtered = await adapter2.listTransactions({
      search: 'နေ့လယ်စာ',
      type: 'expense',
      from: today,
      to: today,
    });
    expect(filtered.meta.total).toBe(1);
    expect(filtered.data[0].amount).toBe(18500);

    const summary = await adapter2.getDashboardSummary(today, today);
    expect(summary.hasAnyTransactions).toBe(true);
    expect(summary.kpis.totalIncome).toBe(700000);
    expect(summary.kpis.totalExpense).toBe(18500);
    expect(summary.kpis.netBalance).toBe(681500);

    const csv = await adapter2.exportCsv({ from: today, to: today }, 'JPY');
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('JPY');
    expect(csv).toContain('လစာ + ဘောနပ်စ်');

    const deleted = await adapter2.deleteTransaction(created.id);
    expect(deleted.deleted).toBe(true);
    expect((await adapter2.listTransactions({})).meta.total).toBe(1);

    const diag = await adapter2.getDiagnostics();
    expect(diag.indexedDbAvailable).toBe(true);
    expect(diag.persisted).toBe(true);
    expect(diag.usageBytes).toBe(4096);
    expect(diag.quotaBytes).toBe(1024 * 1024 * 100);
  });

  it('safely migrates existing v1 IndexedDB schema to v2 without losing rows', async () => {
    // Seed a v1 database directly before opening v2 via DailyLedgerDatabase
    const legacyDb = new Dexie(dbName);
    legacyDb.version(1).stores({
      categories: '++id, type, name, isDefault',
      transactions: '++id, type, categoryId, transactionDate, updatedAt, [type+transactionDate]',
      meta: 'key',
    });
    await legacyDb.open();
    await legacyDb.table('categories').bulkPut(DEFAULT_CATEGORIES);
    await legacyDb.table('transactions').add({
      type: 'expense',
      amount: 12000,
      categoryId: 6,
      transactionDate: toLocalDateString(),
      paymentMethod: 'Cash',
      note: 'v1 row',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    legacyDb.close();

    const upgradedDb = new DailyLedgerDatabase(dbName);
    await upgradedDb.open();
    const rows = await upgradedDb.transactions.toArray();
    expect(rows).toHaveLength(1);
    expect(rows[0].note).toBe('v1 row');
    expect(rows[0].syncStatus).toBe('local_only');
    expect(rows[0].remoteId).toBeNull();
    upgradedDb.close();
  });

  it('copies legacy localStorage entries into IndexedDB without deleting localStorage until confirmed', async () => {
    const today = toLocalDateString();
    memoryStorage.setItem(LOCAL_CATEGORIES_KEY, JSON.stringify(DEFAULT_CATEGORIES));
    memoryStorage.setItem(
      LOCAL_TRANSACTIONS_KEY,
      JSON.stringify([
        {
          id: 42,
          type: 'expense',
          amount: 9500,
          categoryId: 6,
          transactionDate: today,
          paymentMethod: 'Cash',
          note: 'Legacy Coffee',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          category: DEFAULT_CATEGORIES[5],
        },
      ])
    );

    const adapter = new IndexedDbStorageAdapter(dbName);
    adaptersToClose.push(adapter);

    const listed = await adapter.listTransactions({});
    expect(listed.meta.total).toBe(1);
    expect(listed.data[0].note).toBe('Legacy Coffee');

    // Legacy localStorage must NOT be deleted automatically
    expect(memoryStorage.getItem(LOCAL_TRANSACTIONS_KEY)).not.toBeNull();
    const diagBefore = await adapter.getDiagnostics();
    expect(diagBefore.migratedFromLocalStorage).toBe(true);
    expect(diagBefore.hasLegacyLocalStorageData).toBe(true);
    expect(diagBefore.legacyLocalStorageCount).toBe(1);

    // Only cleared when user explicitly confirms
    adapter.clearLegacyLocalStorageData();
    expect(memoryStorage.getItem(LOCAL_TRANSACTIONS_KEY)).toBeNull();
    const diagAfter = await adapter.getDiagnostics();
    expect(diagAfter.hasLegacyLocalStorageData).toBe(false);
  });

  it('supports backup JSON export/restore, sample-data non-overwrite guard, and iOS Safari fallback when navigator.storage is missing', async () => {
    vi.stubGlobal('navigator', {});

    const adapter = new IndexedDbStorageAdapter(dbName);
    adaptersToClose.push(adapter);

    const seeded = await adapter.seedSampleData();
    expect(seeded.inserted).toBe(12);

    // Must not overwrite existing data on second seed
    const secondSeed = await adapter.seedSampleData();
    expect(secondSeed.inserted).toBe(0);

    const backup = await adapter.exportBackupPayload();
    expect(backup.transactions).toHaveLength(12);

    await adapter.clearAllTransactions();
    expect((await adapter.listTransactions({})).meta.total).toBe(0);

    const restored = await adapter.importBackupJson(JSON.stringify(backup));
    expect(restored.restoredCount).toBe(12);

    const diag = await adapter.getDiagnostics();
    expect(diag.persisted).toBeNull();
    expect(diag.usageBytes).toBeNull();
    expect(diag.quotaBytes).toBeNull();
  });

  it('quarantines corrupted IndexedDB records safely without crashing', async () => {
    const adapter = new IndexedDbStorageAdapter(dbName);
    adaptersToClose.push(adapter);
    await adapter.ensureInitialized();

    // Inject malformed transaction directly into IndexedDB
    await (adapter as any).db.transactions.add({
      type: 'expense',
      amount: -999,
      categoryId: 999999,
      transactionDate: 'invalid',
      paymentMethod: 'Cash',
      note: 'corrupt',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const list = await adapter.listTransactions({});
    expect(list.meta.total).toBe(0);

    const diag = await adapter.getDiagnostics();
    expect(diag.corruptedRecoveryKey).toBeTruthy();
  });
});
