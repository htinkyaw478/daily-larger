import { Download, Pencil, Search, Trash2, Upload } from 'lucide-react';
import { type ChangeEvent, useId, useRef } from 'react';
import type {
  Category,
  SortOption,
  Transaction,
  TransactionFilters,
  TransactionType,
} from '../../types/ledger';
import {
  formatCurrency,
  formatFullDate,
  type CurrencyCode,
} from '../../utils/formatters';
import { CategoryIcon } from '../ui/CategoryIcon';

export function TransactionTable({
  transactions,
  total,
  page,
  limit,
  categories,
  filters,
  currency,
  isLoading,
  onFiltersChange,
  onEdit,
  onDeleteRequest,
  onExportCsv,
  onImportCsvFile,
}: {
  transactions: Transaction[];
  total: number;
  page: number;
  limit: number;
  categories: Category[];
  filters: TransactionFilters;
  currency: CurrencyCode;
  isLoading: boolean;
  onFiltersChange: (next: Partial<TransactionFilters>) => void;
  onEdit: (tx: Transaction) => void;
  onDeleteRequest: (tx: Transaction) => void;
  onExportCsv: () => void;
  onImportCsvFile: (file: File) => void;
}) {
  const captionId = useId();
  const csvInputRef = useRef<HTMLInputElement>(null);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) {
      onImportCsvFile(file);
    }
  };

  return (
    <section className="card" aria-labelledby={captionId}>
      <div className="card-header">
        <div>
          <h2 id={captionId} className="card-title">
            စာရင်းစာရွက် · Ledger Transactions
          </h2>
          <p className="card-caption tabular-nums">
            Showing {transactions.length} of {total} entries in selected period
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => csvInputRef.current?.click()}
          >
            <Upload size={17} aria-hidden="true" />
            Import CSV
          </button>
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv,text/csv,application/csv,text/plain"
            className="visually-hidden"
            aria-label="Choose CSV file to import"
            onChange={handleFileChange}
          />
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onExportCsv}
          >
            <Download size={17} aria-hidden="true" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="ledger-toolbar">
        <search className="ledger-filters-form">
          <form
            className="ledger-filters-form"
            onSubmit={(e) => e.preventDefault()}
            aria-label="Filter transactions"
          >
            <div className="search-input-wrap">
              <Search size={17} className="search-input-icon" aria-hidden="true" />
              <label htmlFor="ledger-search" className="visually-hidden">
                Search transactions
              </label>
              <input
                id="ledger-search"
                type="search"
                className="control-input"
                placeholder="Search note, category, method..."
                value={filters.search ?? ''}
                onChange={(e) => onFiltersChange({ search: e.target.value, page: 1 })}
              />
            </div>

            <label htmlFor="filter-type" className="visually-hidden">
              Filter by type
            </label>
            <select
              id="filter-type"
              className="control-select"
              value={filters.type ?? ''}
              onChange={(e) =>
                onFiltersChange({
                  type: (e.target.value || undefined) as TransactionType | undefined,
                  categoryId: undefined,
                  page: 1,
                })
              }
            >
              <option value="">All Types (အားလုံး)</option>
              <option value="income">ဝင်ငွေ (Income)</option>
              <option value="expense">ထွက်ငွေ (Expense)</option>
            </select>

            <label htmlFor="filter-category" className="visually-hidden">
              Filter by category
            </label>
            <select
              id="filter-category"
              className="control-select"
              value={filters.categoryId ?? ''}
              onChange={(e) =>
                onFiltersChange({
                  categoryId: e.target.value ? Number(e.target.value) : undefined,
                  page: 1,
                })
              }
            >
              <option value="">All Categories</option>
              {categories
                .filter((c) => !filters.type || c.type === filters.type)
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nameMy ? `${cat.nameMy} · ${cat.name}` : cat.name}
                  </option>
                ))}
            </select>

            <label htmlFor="filter-sort" className="visually-hidden">
              Sort transactions
            </label>
            <select
              id="filter-sort"
              className="control-select"
              value={filters.sort ?? 'date_desc'}
              onChange={(e) =>
                onFiltersChange({ sort: e.target.value as SortOption, page: 1 })
              }
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="amount_desc">Highest Amount</option>
              <option value="amount_asc">Lowest Amount</option>
            </select>
          </form>
        </search>
      </div>

      <div
        tabIndex={0}
        role="region"
        aria-labelledby={captionId}
        className="table-wrapper"
      >
        <table className="ledger-table">
          <caption className="visually-hidden">
            Daily Ledger transactions matching selected filters
          </caption>
          <thead>
            <tr>
              <th scope="col">ရက်စွဲ · Date</th>
              <th scope="col">အမျိုးအစား · Category</th>
              <th scope="col">မှတ်ချက် · Note</th>
              <th scope="col">Method</th>
              <th scope="col" style={{ textAlign: 'right' }}>
                ပမာဏ · Amount
              </th>
              <th scope="col" style={{ textAlign: 'right' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Loading ledger entries...
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2.25rem', color: 'var(--text-muted)' }}>
                  No matching entries found for the current filters.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="tabular-nums" style={{ whiteSpace: 'nowrap' }}>
                    {formatFullDate(tx.transactionDate)}
                  </td>
                  <td>
                    <span className="category-chip">
                      <span
                        className="category-dot"
                        style={{
                          background: `${tx.category.color}1a`,
                          color: tx.category.color,
                        }}
                      >
                        <CategoryIcon name={tx.category.icon} size={15} />
                      </span>
                      <span>
                        {tx.category.nameMy
                          ? `${tx.category.nameMy} · ${tx.category.name}`
                          : tx.category.name}
                      </span>
                    </span>
                  </td>
                  <td style={{ color: tx.note ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {tx.note || '—'}
                  </td>
                  <td>
                    <span className="method-badge">{tx.paymentMethod}</span>
                  </td>
                  <td
                    className={`amount-cell tabular-nums ${
                      tx.type === 'income' ? 'amount-income' : 'amount-expense'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}
                    {formatCurrency(tx.amount, currency)}
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button
                      type="button"
                      className="btn-ghost"
                      aria-label={`Edit entry ${tx.note || tx.category.name}`}
                      onClick={() => onEdit(tx)}
                    >
                      <Pencil size={15} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="btn-danger-ghost"
                      aria-label={`Delete entry ${tx.note || tx.category.name}`}
                      onClick={() => onDeleteRequest(tx)}
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination-bar">
          <span className="tabular-nums">
            Page {page} of {totalPages}
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={page <= 1}
              onClick={() => onFiltersChange({ page: page - 1 })}
            >
              Previous
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={page >= totalPages}
              onClick={() => onFiltersChange({ page: page + 1 })}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
