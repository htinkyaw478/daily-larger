import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IndexedDbStorageAdapter } from '../storage/indexedDbAdapter';
import { toLocalDateString } from '../utils/formatters';
import { parseAndBuildCsvImportPreview } from './csvImport';
import { DEFAULT_CATEGORIES } from './ledgerLogic';

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

let counter = 0;
function nextDb(): string {
  counter += 1;
  return `daily_ledger_csv_test_${Date.now()}_${counter}`;
}

describe('CSV Import & Round-Trip Integration', () => {
  let dbName: string;
  let adapters: IndexedDbStorageAdapter[] = [];

  beforeEach(() => {
    dbName = nextDb();
    adapters = [];
    vi.stubGlobal('window', { localStorage: createMemoryStorage() });
    vi.stubGlobal('navigator', {
      storage: {
        persisted: async () => true,
        estimate: async () => ({ usage: 1024, quota: 1024 * 1024 * 100 }),
      },
    });
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    for (const adapter of adapters) {
      await adapter.close();
    }
    await Dexie.delete(dbName).catch(() => undefined);
  });

  it('exports CSV and re-imports it into a fresh database preserving IDs, timestamps, Myanmar text, and chart/search visibility', async () => {
    const sourceAdapter = new IndexedDbStorageAdapter(dbName);
    adapters.push(sourceAdapter);
    const today = toLocalDateString();

    const tx1 = await sourceAdapter.createTransaction({
      type: 'income',
      amount: 1200000,
      categoryId: 1,
      transactionDate: today,
      paymentMethod: 'Bank Transfer',
      note: 'လစာဝင်ငွေ, Bonus',
    });
    const tx2 = await sourceAdapter.createTransaction({
      type: 'expense',
      amount: 45500,
      categoryId: 6,
      transactionDate: today,
      paymentMethod: 'KBZPay',
      note: 'နေ့လယ်စာ\nကော်ဖီ "Special"',
    });

    const exportedCsv = await sourceAdapter.exportCsv({ from: today, to: today }, 'MMK');
    expect(exportedCsv.startsWith('\uFEFF')).toBe(true);

    // Import into a brand new IndexedDB instance
    const targetDbName = nextDb();
    const targetAdapter = new IndexedDbStorageAdapter(targetDbName);
    adapters.push(targetAdapter);

    const preview = await targetAdapter.previewCsvImport(exportedCsv);
    expect(preview.headerError).toBeNull();
    expect(preview.totalRows).toBe(2);
    expect(preview.validRows).toBe(2);
    expect(preview.invalidRows).toBe(0);
    expect(preview.duplicateRows).toBe(0);

    const result = await targetAdapter.executeCsvImport(preview, 'skip');
    expect(result.insertedCount).toBe(2);

    const list = await targetAdapter.listTransactions({ search: 'ကော်ဖီ' });
    expect(list.meta.total).toBe(1);
    expect(list.data[0].id).toBe(tx2.id);
    expect(list.data[0].createdAt).toBe(tx2.createdAt);
    expect(list.data[0].note).toBe('နေ့လယ်စာ\nကော်ဖီ "Special"');

    const summary = await targetAdapter.getDashboardSummary(today, today);
    expect(summary.kpis.totalIncome).toBe(1200000);
    expect(summary.kpis.totalExpense).toBe(45500);
    expect(summary.categoryBreakdown.expense[0].total).toBe(45500);

    const all = await targetAdapter.listTransactions({ sort: 'date_asc' });
    expect(all.data.some((t) => t.id === tx1.id)).toBe(true);

    await targetAdapter.close();
    await Dexie.delete(targetDbName).catch(() => undefined);
  });

  it('handles quoted multiline values, commas inside quotes, Myanmar Unicode, and LF/CR/CRLF line endings', () => {
    const csvWithCrAndLf =
      'ID,Date,Type,Category,Category (Burmese),Payment Method,Note,Currency,Amount\r' +
      '10,2026-11-20,expense,Food & Dining,အစားအသောက်,KBZPay,"မနက်စာ, လက်ဖက်ရည်\nမုန့်ဟင်းခါး",MMK,12500.00\n' +
      '11,2026-11-20,income,Sales,ရောင်းရငွေ,Cash,"Quote ""test""",MMK,80000.00';

    const preview = parseAndBuildCsvImportPreview(csvWithCrAndLf, DEFAULT_CATEGORIES, []);
    expect(preview.headerError).toBeNull();
    expect(preview.totalRows).toBe(2);
    expect(preview.validRows).toBe(2);
    expect(preview.rows[0].parsed?.note).toBe('မနက်စာ, လက်ဖက်ရည်\nမုန့်ဟင်းခါး');
    expect(preview.rows[1].parsed?.note).toBe('Quote "test"');
  });

  it('handles duplicate records across skip, update, and import_as_new strategies without duplicate IDs', async () => {
    const adapter = new IndexedDbStorageAdapter(dbName);
    adapters.push(adapter);

    const existing = await adapter.createTransaction({
      type: 'expense',
      amount: 10000,
      categoryId: 6,
      transactionDate: '2026-11-20',
      paymentMethod: 'Cash',
      note: 'Original Lunch',
    });

    const csv =
      '\uFEFFID,Date,Type,Category,Payment Method,Note,Amount\r\n' +
      `${existing.id},2026-11-20,expense,Food & Dining,KBZPay,Updated Lunch,18000.00\r\n` +
      '99,2026-11-20,income,Salary,Bank Transfer,New Bonus,200000.00\r\n';

    // 1. Skip duplicates
    const previewSkip = await adapter.previewCsvImport(csv);
    expect(previewSkip.duplicateRows).toBe(1);
    expect(previewSkip.newRows).toBe(1);

    const resSkip = await adapter.executeCsvImport(previewSkip, 'skip');
    expect(resSkip.insertedCount).toBe(1);
    expect(resSkip.skippedCount).toBe(1);
    expect((await adapter.listTransactions({})).data.find((t) => t.id === existing.id)?.amount).toBe(10000);

    // 2. Update existing records
    const csvUpdateOnly =
      'ID,Date,Type,Category,Payment Method,Note,Amount\n' +
      `${existing.id},2026-11-20,expense,Food & Dining,KBZPay,Updated Lunch,18000.00`;
    const previewUpdate = await adapter.previewCsvImport(csvUpdateOnly);
    expect(previewUpdate.duplicateRows).toBe(1);

    const resUpdate = await adapter.executeCsvImport(previewUpdate, 'update');
    expect(resUpdate.updatedCount).toBe(1);
    const afterUpdate = (await adapter.listTransactions({})).data.find((t) => t.id === existing.id);
    expect(afterUpdate?.amount).toBe(18000);
    expect(afterUpdate?.note).toBe('Updated Lunch');

    // 3. Import as new records (must assign new unique ID without overwriting existing ID)
    const previewAsNew = await adapter.previewCsvImport(csvUpdateOnly);
    const resAsNew = await adapter.executeCsvImport(previewAsNew, 'import_as_new');
    expect(resAsNew.insertedCount).toBe(1);
    const all = await adapter.listTransactions({});
    expect(all.meta.total).toBe(3);
    const ids = all.data.map((d) => d.id);
    expect(new Set(ids).size).toBe(3);
  });

  it('reports invalid rows with exact row numbers and handles empty or malformed-header CSVs', () => {
    const emptyPreview = parseAndBuildCsvImportPreview('\uFEFF   \r\n', DEFAULT_CATEGORIES, []);
    expect(emptyPreview.headerError).toMatch(/empty/i);

    const badHeaders = parseAndBuildCsvImportPreview('Foo,Bar\n1,2', DEFAULT_CATEGORIES, []);
    expect(badHeaders.headerError).toMatch(/missing required csv columns/i);

    const mixedCsv =
      'ID,Date,Type,Category,Amount,Note\n' +
      'abc,2026-02-30,invalid_type,, -50,Bad row\n' +
      '5,2026-11-20,expense,Food & Dining,15000,Good row';

    const preview = parseAndBuildCsvImportPreview(mixedCsv, DEFAULT_CATEGORIES, []);
    expect(preview.totalRows).toBe(2);
    expect(preview.invalidRows).toBe(1);
    expect(preview.validRows).toBe(1);
    expect(preview.rows[0].rowNumber).toBe(2);
    expect(preview.rows[0].errors.length).toBeGreaterThanOrEqual(4);
    expect(preview.rows[1].status).toBe('new');
  });

  it('imports a large CSV (1,200 rows) atomically into IndexedDB and verifies search & summary', async () => {
    const adapter = new IndexedDbStorageAdapter(dbName);
    adapters.push(adapter);

    const lines = ['Date,Type,Category,Payment Method,Note,Amount'];
    for (let i = 1; i <= 1200; i++) {
      const day = String(((i - 1) % 28) + 1).padStart(2, '0');
      lines.push(`2026-11-${day},expense,Food & Dining,KBZPay,Bulk item #${i},1000`);
    }
    const largeCsv = lines.join('\n');

    const preview = await adapter.previewCsvImport(largeCsv);
    expect(preview.totalRows).toBe(1200);
    expect(preview.newRows).toBe(1200);

    const res = await adapter.executeCsvImport(preview, 'skip');
    expect(res.insertedCount).toBe(1200);

    const searchRes = await adapter.listTransactions({ search: 'Bulk item #1199' });
    expect(searchRes.meta.total).toBe(1);
    expect(searchRes.data[0].amount).toBe(1000);

    const summary = await adapter.getDashboardSummary('2026-11-01', '2026-11-30');
    expect(summary.kpis.totalExpense).toBe(1200000);
  });
});
