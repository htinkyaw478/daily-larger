import { ChevronDown, Download, Pencil, Search, Trash2, Upload } from 'lucide-react';
import { type ChangeEvent, useEffect, useId, useRef, useState } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import {
  formatLocalizedFullDate,
  formatLocalizedShortDate,
  getCategoryLabel,
  getPaymentMethodLabel,
  getTypeLabel,
} from '../../i18n/translations';
import type {
  Category,
  SortOption,
  Transaction,
  TransactionFilters,
  TransactionType,
} from '../../types/ledger';
import { formatCurrency, type CurrencyCode } from '../../utils/formatters';
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
  const { language, t } = useI18n();
  const captionId = useId();
  const csvInputRef = useRef<HTMLInputElement>(null);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => new Set());

  // Always start collapsed by default when list page or filters change
  useEffect(() => {
    setExpandedIds(new Set());
  }, [page, filters.search, filters.type, filters.categoryId, filters.from, filters.to, filters.sort]);

  const toggleExpanded = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

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
            {t.ledger.title}
          </h2>
          <p className="card-caption tabular-nums">
            {t.ledger.showingCount(transactions.length, total)}
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.55rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => csvInputRef.current?.click()}
          >
            <Upload size={17} aria-hidden="true" />
            {t.ledger.importCsv}
          </button>
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv,text/csv,application/csv,text/plain"
            className="visually-hidden"
            aria-label={t.ledger.importCsv}
            onChange={handleFileChange}
          />
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onExportCsv}
          >
            <Download size={17} aria-hidden="true" />
            {t.ledger.exportCsv}
          </button>
        </div>
      </div>

      <div className="ledger-toolbar">
        <search className="ledger-filters-form">
          <form
            className="ledger-filters-form"
            onSubmit={(e) => e.preventDefault()}
            aria-label={t.ledger.searchLabel}
          >
            <div className="search-input-wrap">
              <Search size={17} className="search-input-icon" aria-hidden="true" />
              <label htmlFor="ledger-search" className="visually-hidden">
                {t.ledger.searchLabel}
              </label>
              <input
                id="ledger-search"
                type="search"
                className="control-input"
                placeholder={t.ledger.searchPlaceholder}
                value={filters.search ?? ''}
                onChange={(e) => onFiltersChange({ search: e.target.value, page: 1 })}
              />
            </div>

            <label htmlFor="filter-type" className="visually-hidden">
              {t.ledger.allTypes}
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
              <option value="">{t.ledger.allTypes}</option>
              <option value="income">{t.ledger.incomeType}</option>
              <option value="expense">{t.ledger.expenseType}</option>
            </select>

            <label htmlFor="filter-category" className="visually-hidden">
              {t.ledger.allCategories}
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
              <option value="">{t.ledger.allCategories}</option>
              {categories
                .filter((c) => !filters.type || c.type === filters.type)
                .map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {getCategoryLabel(cat, language)}
                  </option>
                ))}
            </select>

            <label htmlFor="filter-sort" className="visually-hidden">
              {t.ledger.sortNewest}
            </label>
            <select
              id="filter-sort"
              className="control-select"
              value={filters.sort ?? 'date_desc'}
              onChange={(e) =>
                onFiltersChange({ sort: e.target.value as SortOption, page: 1 })
              }
            >
              <option value="date_desc">{t.ledger.sortNewest}</option>
              <option value="date_asc">{t.ledger.sortOldest}</option>
              <option value="amount_desc">{t.ledger.sortHighest}</option>
              <option value="amount_asc">{t.ledger.sortLowest}</option>
            </select>
          </form>
        </search>
      </div>

      {/* Desktop semantic transaction table */}
      <div
        tabIndex={0}
        role="region"
        aria-labelledby={captionId}
        className="table-wrapper ledger-desktop-table"
      >
        <table className="ledger-table">
          <caption className="visually-hidden">{t.ledger.title}</caption>
          <thead>
            <tr>
              <th scope="col">{t.ledger.colDate}</th>
              <th scope="col">{t.ledger.colCategory}</th>
              <th scope="col">{t.ledger.colNote}</th>
              <th scope="col">{t.ledger.colMethod}</th>
              <th scope="col" style={{ textAlign: 'right' }}>
                {t.ledger.colAmount}
              </th>
              <th scope="col" style={{ textAlign: 'right' }}>
                {t.ledger.colActions}
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  {t.ledger.loading}
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2.25rem', color: 'var(--text-muted)' }}>
                  {t.ledger.emptyFiltered}
                </td>
              </tr>
            ) : (
              transactions.map((tx) => {
                const catLabel = getCategoryLabel(tx.category, language);
                const actionTargetLabel = tx.note || catLabel;
                return (
                  <tr key={tx.id}>
                    <td className="tabular-nums" style={{ whiteSpace: 'nowrap' }}>
                      {formatLocalizedFullDate(tx.transactionDate, language)}
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
                        <span>{catLabel}</span>
                      </span>
                    </td>
                    <td style={{ color: tx.note ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                      {tx.note || '—'}
                    </td>
                    <td>
                      <span className="method-badge">
                        {getPaymentMethodLabel(tx.paymentMethod, language)}
                      </span>
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
                        aria-label={t.ledger.editAria(actionTargetLabel)}
                        onClick={() => onEdit(tx)}
                      >
                        <Pencil size={15} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="btn-danger-ghost"
                        aria-label={t.ledger.deleteAria(actionTargetLabel)}
                        onClick={() => onDeleteRequest(tx)}
                      >
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile compact progressive-disclosure transaction list */}
      <div className="mobile-tx-list" aria-label={t.ledger.title}>
        {isLoading ? (
          <div className="mobile-tx-empty">{t.ledger.loading}</div>
        ) : transactions.length === 0 ? (
          <div className="mobile-tx-empty">{t.ledger.emptyFiltered}</div>
        ) : (
          transactions.map((tx) => {
            const isExpanded = expandedIds.has(tx.id);
            const catLabel = getCategoryLabel(tx.category, language);
            const actionTargetLabel = tx.note || catLabel;
            const detailsId = `mobile-tx-details-${tx.id}`;

            return (
              <article
                key={tx.id}
                className={`mobile-tx-item${isExpanded ? ' is-expanded' : ''}`}
              >
                <button
                  type="button"
                  className="mobile-tx-trigger"
                  aria-expanded={isExpanded}
                  aria-controls={detailsId}
                  onClick={() => toggleExpanded(tx.id)}
                >
                  <span className="mobile-tx-date tabular-nums">
                    {formatLocalizedShortDate(tx.transactionDate, language)}
                  </span>

                  <span className="mobile-tx-category">
                    <span
                      className="category-dot"
                      aria-hidden="true"
                      style={{
                        background: `${tx.category.color}1a`,
                        color: tx.category.color,
                      }}
                    >
                      <CategoryIcon name={tx.category.icon} size={14} />
                    </span>
                    <span className="mobile-tx-category-name">{catLabel}</span>
                  </span>

                  <span
                    className={`mobile-tx-amount tabular-nums ${
                      tx.type === 'income' ? 'amount-income' : 'amount-expense'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}
                    {formatCurrency(tx.amount, currency)}
                  </span>

                  <ChevronDown
                    size={16}
                    className="mobile-tx-chevron"
                    aria-hidden="true"
                  />
                </button>

                <div
                  id={detailsId}
                  className="mobile-tx-details-wrap"
                  aria-hidden={!isExpanded}
                >
                  <div className="mobile-tx-details-inner">
                    <dl className="mobile-tx-meta-grid">
                      <div className="mobile-tx-meta-pair">
                        <dt>{t.ledger.colType}</dt>
                        <dd>
                          <span
                            className={`type-pill ${
                              tx.type === 'income' ? 'type-pill--income' : 'type-pill--expense'
                            }`}
                          >
                            {getTypeLabel(tx.type, language)}
                          </span>
                        </dd>
                      </div>

                      <div className="mobile-tx-meta-pair">
                        <dt>{t.ledger.colDate}</dt>
                        <dd className="tabular-nums">
                          {formatLocalizedFullDate(tx.transactionDate, language)}
                        </dd>
                      </div>

                      <div className="mobile-tx-meta-pair">
                        <dt>{t.ledger.colMethod}</dt>
                        <dd>
                          <span className="method-badge">
                            {getPaymentMethodLabel(tx.paymentMethod, language)}
                          </span>
                        </dd>
                      </div>

                      <div className="mobile-tx-meta-pair mobile-tx-meta-pair--full">
                        <dt>{t.ledger.colNote}</dt>
                        <dd className="mobile-tx-note">
                          {tx.note ? tx.note : <span className="text-muted">{t.ledger.noNote}</span>}
                        </dd>
                      </div>
                    </dl>

                    <div className="mobile-tx-actions">
                      <button
                        type="button"
                        className="btn btn-secondary mobile-tx-action-btn"
                        tabIndex={isExpanded ? 0 : -1}
                        aria-label={t.ledger.editAria(actionTargetLabel)}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(tx);
                        }}
                      >
                        <Pencil size={15} aria-hidden="true" />
                        {t.ledger.editBtn}
                      </button>

                      <button
                        type="button"
                        className="btn mobile-tx-action-btn mobile-tx-delete-btn"
                        tabIndex={isExpanded ? 0 : -1}
                        aria-label={t.ledger.deleteAria(actionTargetLabel)}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteRequest(tx);
                        }}
                      >
                        <Trash2 size={15} aria-hidden="true" />
                        {t.ledger.deleteBtn}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination-bar">
          <span className="tabular-nums">{t.ledger.pageInfo(page, totalPages)}</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={page <= 1}
              onClick={() => onFiltersChange({ page: page - 1 })}
            >
              {t.ledger.previous}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={page >= totalPages}
              onClick={() => onFiltersChange({ page: page + 1 })}
            >
              {t.ledger.next}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
