import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getSavedCurrencyPreference,
  saveCurrencyPreference,
  type StorageMode,
} from '../storage/ledgerStorage';
import {
  getStorageStatus,
  indexedDbAdapter,
  resolveStorage,
  switchStorageMode,
} from '../storage/storageManager';
import type {
  CsvImportPreview,
  CsvImportResult,
  DuplicateStrategy,
} from '../domain/csvImport';
import type {
  CreateTransactionInput,
  TransactionFilters,
  TransactionType,
} from '../types/ledger';
import type { CurrencyCode } from '../utils/formatters';

export { getSavedCurrencyPreference, saveCurrencyPreference };

export function useStorageStatus() {
  return useQuery({
    queryKey: ['storage-status'],
    queryFn: async () => {
      await resolveStorage();
      return getStorageStatus();
    },
    staleTime: 30_000,
  });
}

export function useSwitchStorageMode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mode: StorageMode) => switchStorageMode(mode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-status'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useCategories(type?: TransactionType) {
  return useQuery({
    queryKey: ['categories', type ?? 'all'],
    queryFn: async () => {
      const storage = await resolveStorage();
      return storage.getCategories(type);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useDashboardSummary(from: string, to: string) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ['dashboard', { from, to }],
    queryFn: async () => {
      const storage = await resolveStorage();
      const result = await storage.getDashboardSummary(from, to);
      queryClient.setQueryData(['storage-status'], await getStorageStatus());
      return result;
    },
  });
}

export function useTransactions(filters: TransactionFilters) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: async () => {
      const storage = await resolveStorage();
      return storage.listTransactions(filters);
    },
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTransactionInput) => {
      const storage = await resolveStorage();
      return storage.createTransaction(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['storage-status'] });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: number;
      input: Partial<CreateTransactionInput>;
    }) => {
      const storage = await resolveStorage();
      return storage.updateTransaction(id, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['storage-status'] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const storage = await resolveStorage();
      return storage.deleteTransaction(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['storage-status'] });
    },
  });
}

export function useSeedSampleData() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const storage = await resolveStorage();
      return storage.seedSampleData();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['storage-status'] });
    },
  });
}

export function useImportBackup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rawJson: string) => {
      return indexedDbAdapter.importBackupJson(rawJson);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['storage-status'] });
    },
  });
}

export function useClearLegacyLocalStorage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      indexedDbAdapter.clearLegacyLocalStorageData();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-status'] });
    },
  });
}

export function usePreviewCsvImport() {
  return useMutation({
    mutationFn: async (rawCsvText: string): Promise<CsvImportPreview> => {
      const storage = await resolveStorage();
      return storage.previewCsvImport(rawCsvText);
    },
  });
}

export function useExecuteCsvImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      preview,
      strategy,
    }: {
      preview: CsvImportPreview;
      strategy: DuplicateStrategy;
    }): Promise<CsvImportResult> => {
      const storage = await resolveStorage();
      return storage.executeCsvImport(preview, strategy);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['storage-status'] });
    },
  });
}

function triggerFileDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function downloadTransactionsCsv(
  filters: TransactionFilters,
  currency: CurrencyCode
): Promise<void> {
  const storage = await resolveStorage();
  const csv = await storage.exportCsv(filters, currency);
  const filename = `daily-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
  triggerFileDownload(csv, filename, 'text/csv;charset=utf-8;');
}

export async function downloadLocalBackupJson(): Promise<void> {
  const payload = await indexedDbAdapter.exportBackupPayload();
  const json = JSON.stringify(payload, null, 2);
  const filename = `daily-ledger-backup-${new Date().toISOString().slice(0, 10)}.json`;
  triggerFileDownload(json, filename, 'application/json;charset=utf-8;');
}

export function dismissCorruptedNotice(): void {
  indexedDbAdapter.dismissCorruptedNotice();
}
