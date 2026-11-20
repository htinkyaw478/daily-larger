import { afterEach, describe, expect, it, vi } from 'vitest';
import { toLocalDateString } from '../utils/formatters';
import { getStorageStatus, resolveStorage } from './storageManager';

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

describe('storageManager fallback when IndexedDB is unavailable', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('falls back to LocalStorageAdapter and still saves entries if IndexedDB is blocked', async () => {
    vi.stubGlobal('window', { localStorage: createMemoryStorage() });
    vi.stubGlobal('indexedDB', undefined);

    const storage = await resolveStorage(true);
    const status = await getStorageStatus();
    expect(status.engine).toBe('localstorage');

    const created = await storage.createTransaction({
      type: 'expense',
      amount: 12000,
      categoryId: 6,
      transactionDate: toLocalDateString(),
      paymentMethod: 'Cash',
      note: 'Fallback save test',
    });
    expect(created.id).toBe(1);

    const list = await storage.listTransactions({});
    expect(list.meta.total).toBe(1);
    expect(list.data[0].note).toBe('Fallback save test');
  });
});
