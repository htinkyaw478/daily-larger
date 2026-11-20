import {
  type CsvImportPreview,
  type CsvImportResult,
  type DuplicateStrategy,
  parseAndBuildCsvImportPreview,
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
import type { CurrencyCode } from '../utils/formatters';
import type { LedgerStorage } from './ledgerStorage';

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

export class ApiStorageAdapter implements LedgerStorage {
  readonly mode = 'api' as const;
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  private async apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
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

  async checkHealth(timeoutMs = 1500): Promise<boolean> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${this.baseUrl}/health`, { signal: controller.signal });
      if (!res.ok) return false;
      const contentType = res.headers.get('content-type') ?? '';
      if (!contentType.includes('application/json')) return false;
      const json = await res.json().catch(() => null);
      return json?.data?.status === 'ok';
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  }

  async getCategories(type?: TransactionType): Promise<Category[]> {
    const qs = buildQueryParams({ type });
    const res = await this.apiFetch<{ data: Category[] }>(`/categories${qs}`);
    return res.data;
  }

  async getDashboardSummary(from: string, to: string): Promise<DashboardSummary> {
    const qs = buildQueryParams({ from, to });
    const res = await this.apiFetch<{ data: DashboardSummary }>(`/dashboard/summary${qs}`);
    return res.data;
  }

  async listTransactions(filters: TransactionFilters): Promise<TransactionsResponse> {
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
    return this.apiFetch<TransactionsResponse>(`/transactions${qs}`);
  }

  async createTransaction(input: CreateTransactionInput): Promise<Transaction> {
    const res = await this.apiFetch<{ data: Transaction }>('/transactions', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return res.data;
  }

  async updateTransaction(
    id: number,
    input: Partial<CreateTransactionInput>
  ): Promise<Transaction> {
    const res = await this.apiFetch<{ data: Transaction }>(`/transactions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
    return res.data;
  }

  async deleteTransaction(id: number): Promise<{ id: number; deleted: boolean }> {
    const res = await this.apiFetch<{ data: { id: number; deleted: boolean } }>(
      `/transactions/${id}`,
      { method: 'DELETE' }
    );
    return res.data;
  }

  async seedSampleData(): Promise<{ inserted: number; message: string }> {
    const res = await this.apiFetch<{ data: { inserted: number; message: string } }>(
      '/transactions/sample',
      { method: 'POST' }
    );
    return res.data;
  }

  async exportCsv(filters: TransactionFilters, currency: CurrencyCode): Promise<string> {
    const qs = buildQueryParams({
      search: filters.search,
      type: filters.type,
      categoryId: filters.categoryId,
      from: filters.from,
      to: filters.to,
      sort: filters.sort,
      currency,
    });
    const res = await fetch(`${this.baseUrl}/transactions/export${qs}`);
    if (!res.ok) {
      throw new Error(`CSV export failed (${res.status})`);
    }
    return res.text();
  }

  async previewCsvImport(rawCsvText: string): Promise<CsvImportPreview> {
    const [categories, list] = await Promise.all([
      this.getCategories(),
      this.listTransactions({ page: 1, limit: 100 }),
    ]);
    return parseAndBuildCsvImportPreview(rawCsvText, categories, list.data);
  }

  async executeCsvImport(
    preview: CsvImportPreview,
    strategy: DuplicateStrategy
  ): Promise<CsvImportResult> {
    if (preview.headerError) {
      throw new Error(preview.headerError);
    }

    const categories = await this.getCategories();
    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let invalidCount = 0;
    let createdCategoriesCount = 0;

    for (const row of preview.rows) {
      if (row.status === 'invalid' || !row.parsed) {
        invalidCount += 1;
        continue;
      }
      const parsed = row.parsed;

      let cat = categories.find(
        (c) =>
          c.type === parsed.type &&
          c.name.toLowerCase() === parsed.categoryName.toLowerCase()
      );
      if (!cat) {
        const res = await this.apiFetch<{ data: Category }>('/categories', {
          method: 'POST',
          body: JSON.stringify({
            name: parsed.categoryName,
            nameMy: parsed.categoryNameMy,
            type: parsed.type,
            icon: 'tag',
            color: parsed.type === 'income' ? '#2196F3' : '#1565C0',
          }),
        });
        cat = res.data;
        categories.push(cat);
        createdCategoriesCount += 1;
      }

      if (row.status === 'duplicate') {
        if (strategy === 'skip') {
          skippedCount += 1;
          continue;
        }
        if (strategy === 'update' && row.matchedExistingId) {
          await this.updateTransaction(row.matchedExistingId, {
            type: parsed.type,
            amount: parsed.amount,
            categoryId: cat.id,
            transactionDate: parsed.transactionDate,
            paymentMethod: parsed.paymentMethod,
            note: parsed.note,
          });
          updatedCount += 1;
          continue;
        }
      }

      await this.createTransaction({
        type: parsed.type,
        amount: parsed.amount,
        categoryId: cat.id,
        transactionDate: parsed.transactionDate,
        paymentMethod: parsed.paymentMethod,
        note: parsed.note,
      });
      insertedCount += 1;
    }

    return {
      insertedCount,
      updatedCount,
      skippedCount,
      invalidCount,
      createdCategoriesCount,
    };
  }
}
