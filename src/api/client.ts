import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  Category,
  CreateTransactionInput,
  DashboardSummary,
  Transaction,
  TransactionFilters,
  TransactionsResponse,
  TransactionType,
} from '../types/ledger';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || '/api/v1';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = payload?.error?.message ?? `Request failed (${res.status})`;
    throw new Error(message);
  }
  return payload as T;
}

function buildQueryParams(params: Record<string, string | number | undefined>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value));
    }
  }
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export function useCategories(type?: TransactionType) {
  return useQuery({
    queryKey: ['categories', type ?? 'all'],
    queryFn: async () => {
      const qs = buildQueryParams({ type });
      const res = await apiFetch<{ data: Category[] }>(`/categories${qs}`);
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useDashboardSummary(from: string, to: string) {
  return useQuery({
    queryKey: ['dashboard', { from, to }],
    queryFn: async () => {
      const qs = buildQueryParams({ from, to });
      const res = await apiFetch<{ data: DashboardSummary }>(`/dashboard/summary${qs}`);
      return res.data;
    },
  });
}

export function useTransactions(filters: TransactionFilters) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: async () => {
      const qs = buildQueryParams({
        search: filters.search,
        type: filters.type,
        categoryId: filters.categoryId,
        from: filters.from,
        to: filters.to,
        sort: filters.sort,
        page: filters.page,
        limit: filters.limit,
      });
      return apiFetch<TransactionsResponse>(`/transactions${qs}`);
    },
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTransactionInput) => {
      const res = await apiFetch<{ data: Transaction }>('/transactions', {
        method: 'POST',
        body: JSON.stringify(input),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
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
      const res = await apiFetch<{ data: Transaction }>(`/transactions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      return apiFetch<{ data: { id: number; deleted: boolean } }>(`/transactions/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useSeedSampleData() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      return apiFetch<{ data: { inserted: number; message: string } }>(
        '/transactions/sample',
        { method: 'POST' }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function getExportCsvUrl(
  filters: TransactionFilters,
  currency: 'MMK' | 'KRW' | 'JPY' = 'MMK'
): string {
  const qs = buildQueryParams({
    search: filters.search,
    type: filters.type,
    categoryId: filters.categoryId,
    from: filters.from,
    to: filters.to,
    sort: filters.sort,
    currency,
  });
  return `${API_BASE}/transactions/export${qs}`;
}
