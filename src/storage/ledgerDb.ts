import Dexie, { type EntityTable } from 'dexie';
import type { Category, TransactionType } from '../types/ledger';

export interface StoredCategoryRow extends Omit<Category, 'id'> {
  id?: number;
}

export type SyncStatus = 'local_only' | 'pending_sync' | 'synced';

export interface StoredTransactionRow {
  id?: number;
  type: TransactionType;
  amount: number;
  categoryId: number;
  transactionDate: string;
  paymentMethod: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  syncStatus?: SyncStatus;
  remoteId?: number | null;
}

export interface StoredMetaRow {
  key: string;
  value: unknown;
  updatedAt: string;
}

export const LEDGER_DB_NAME = 'daily_ledger_db';
export const LEDGER_DB_VERSION = 2;

export class DailyLedgerDatabase extends Dexie {
  categories!: EntityTable<StoredCategoryRow, 'id'>;
  transactions!: EntityTable<StoredTransactionRow, 'id'>;
  meta!: EntityTable<StoredMetaRow, 'key'>;

  constructor(dbName: string = LEDGER_DB_NAME) {
    super(dbName);

    // Version 1: Initial IndexedDB schema replacing localStorage arrays
    this.version(1).stores({
      categories: '++id, type, name, isDefault',
      transactions: '++id, type, categoryId, transactionDate, updatedAt, [type+transactionDate]',
      meta: 'key',
    });

    // Version 2: Add syncStatus & remoteId indexes for future PostgreSQL synchronization
    this.version(2)
      .stores({
        categories: '++id, type, name, isDefault',
        transactions:
          '++id, type, categoryId, transactionDate, updatedAt, syncStatus, remoteId, [type+transactionDate]',
        meta: 'key',
      })
      .upgrade(async (tx) => {
        await tx
          .table<StoredTransactionRow>('transactions')
          .toCollection()
          .modify((row) => {
            if (!row.syncStatus) {
              row.syncStatus = 'local_only';
            }
            if (row.remoteId === undefined) {
              row.remoteId = null;
            }
          });
      });
  }
}
