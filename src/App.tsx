import { BookOpen, Plus, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  useCategories,
  useCreateTransaction,
  useDashboardSummary,
  useDeleteTransaction,
  useSeedSampleData,
  useTransactions,
  useUpdateTransaction,
} from './api/client';
import { CashFlowChart } from './components/dashboard/CashFlowChart';
import { CategoryRing } from './components/dashboard/CategoryRing';
import { KpiCards } from './components/dashboard/KpiCards';
import { ConfirmDeleteDialog } from './components/entry/ConfirmDeleteDialog';
import { EntryDrawer } from './components/entry/EntryDrawer';
import { TransactionTable } from './components/ledger/TransactionTable';
import type {
  CreateTransactionInput,
  Transaction,
  TransactionFilters,
} from './types/ledger';
import {
  CURRENCY_CONFIGS,
  getPresetDateRange,
  isCurrencyCode,
  type CurrencyCode,
  type PeriodPreset,
} from './utils/formatters';

const CURRENCY_STORAGE_KEY = 'daily_ledger_currency';

export function App() {
  const [currency, setCurrency] = useState<CurrencyCode>(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem(CURRENCY_STORAGE_KEY) : null;
    return isCurrencyCode(saved) ? saved : 'MMK';
  });
  const [preset, setPreset] = useState<PeriodPreset>('month');
  const [dateRange, setDateRange] = useState(() => getPresetDateRange('month'));
  const [filters, setFilters] = useState<TransactionFilters>({
    sort: 'date_desc',
    page: 1,
    limit: 12,
  });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const { data: categories = [] } = useCategories();
  const dashboardQuery = useDashboardSummary(dateRange.from, dateRange.to);
  const transactionsQuery = useTransactions({
    ...filters,
    from: dateRange.from,
    to: dateRange.to,
  });

  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();
  const deleteMutation = useDeleteTransaction();
  const sampleMutation = useSeedSampleData();

  const handleCurrencyChange = (nextCurrency: CurrencyCode) => {
    setCurrency(nextCurrency);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(CURRENCY_STORAGE_KEY, nextCurrency);
    }
  };

  const handlePresetChange = (nextPreset: Exclude<PeriodPreset, 'custom'>) => {
    setPreset(nextPreset);
    setDateRange(getPresetDateRange(nextPreset));
    setFilters((prev) => ({ ...prev, page: 1 }));
  };

  const handleOpenAdd = () => {
    setEditingTx(null);
    setDrawerOpen(true);
  };

  const handleOpenEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setDrawerOpen(true);
  };

  const handleSaveEntry = async (payload: CreateTransactionInput, keepOpen: boolean) => {
    if (editingTx) {
      await updateMutation.mutateAsync({ id: editingTx.id, input: payload });
      setDrawerOpen(false);
      setEditingTx(null);
      setToast('စာရင်း ပြင်ဆင်ပြီးပါပြီ · Entry updated');
      return;
    }

    await createMutation.mutateAsync(payload);
    setToast('စာရင်းသစ် သိမ်းဆည်းပြီးပါပြီ · Entry saved');
    if (!keepOpen) {
      setDrawerOpen(false);
    }
  };

  const handleConfirmDelete = async (id: number) => {
    await deleteMutation.mutateAsync(id);
    setDeleteTarget(null);
    setToast('စာရင်း ဖျက်ပြီးပါပြီ · Entry removed');
  };

  const handleLoadSample = async () => {
    await sampleMutation.mutateAsync();
    setToast('နမူနာ စာရင်းများ ထည့်သွင်းပြီးပါပြီ · Sample data loaded');
  };

  const summary = dashboardQuery.data;
  const showEmptyOnboarding = summary && !summary.hasAnyTransactions;

  return (
    <div className="app-shell">
      <header className="top-header">
        <div className="brand-block">
          <div className="brand-mark" aria-hidden="true">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="brand-title">နေ့စဉ် စာရင်း · Daily Ledger</h1>
            <p className="brand-subtitle">
              Calm, clear personal & daily cash-flow management
            </p>
          </div>
        </div>

        <div className="header-actions">
          <div className="period-pills" role="group" aria-label="Dashboard date range">
            <button
              type="button"
              className="period-pill"
              aria-pressed={preset === 'today'}
              onClick={() => handlePresetChange('today')}
            >
              Today
            </button>
            <button
              type="button"
              className="period-pill"
              aria-pressed={preset === 'week'}
              onClick={() => handlePresetChange('week')}
            >
              7 Days
            </button>
            <button
              type="button"
              className="period-pill"
              aria-pressed={preset === 'month'}
              onClick={() => handlePresetChange('month')}
            >
              This Month
            </button>
          </div>

          <label htmlFor="header-currency" className="visually-hidden">
            Currency
          </label>
          <select
            id="header-currency"
            className="control-select"
            aria-label="Display currency"
            value={currency}
            onChange={(e) => handleCurrencyChange(e.target.value as CurrencyCode)}
          >
            {Object.values(CURRENCY_CONFIGS).map((cfg) => (
              <option key={cfg.code} value={cfg.code}>
                {cfg.labelMy}
              </option>
            ))}
          </select>

          <button type="button" className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={18} aria-hidden="true" />
            <span>စာရင်းသစ်ထည့်ရန် · Add Entry</span>
          </button>
        </div>
      </header>

      <main>
        {dashboardQuery.isError && (
          <div
            role="alert"
            className="card"
            style={{
              marginBottom: '1.25rem',
              borderColor: 'var(--expense-fg)',
              background: 'var(--expense-bg)',
              color: 'var(--expense-fg)',
            }}
          >
            Unable to connect to the Daily Ledger API. Make sure the backend server and PostgreSQL database are running.
          </div>
        )}

        {showEmptyOnboarding && (
          <section className="empty-hero" aria-label="Welcome onboarding">
            <div>
              <h2>မင်္ဂလာပါ — Welcome to Your Daily Ledger</h2>
              <p>
                Your ledger is fresh and ready. Log your first income or expense in seconds, or load sample entries to explore the dashboard charts immediately.
              </p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              <button type="button" className="btn btn-primary" onClick={handleOpenAdd}>
                <Plus size={18} aria-hidden="true" />
                Add Your First Entry
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={sampleMutation.isPending}
                onClick={handleLoadSample}
              >
                <Sparkles size={17} aria-hidden="true" />
                {sampleMutation.isPending ? 'Loading...' : 'Load Sample Data'}
              </button>
            </div>
          </section>
        )}

        <KpiCards
          kpis={summary?.kpis}
          currency={currency}
          isLoading={dashboardQuery.isLoading}
        />

        <div className="charts-grid">
          <CashFlowChart
            data={summary?.cashFlow ?? []}
            currency={currency}
            isLoading={dashboardQuery.isLoading}
          />
          <CategoryRing
            breakdown={summary?.categoryBreakdown}
            currency={currency}
            isLoading={dashboardQuery.isLoading}
          />
        </div>

        <TransactionTable
          transactions={transactionsQuery.data?.data ?? []}
          total={transactionsQuery.data?.meta.total ?? 0}
          page={filters.page ?? 1}
          limit={filters.limit ?? 12}
          categories={categories}
          filters={filters}
          currency={currency}
          isLoading={transactionsQuery.isLoading}
          onFiltersChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
          onEdit={handleOpenEdit}
          onDeleteRequest={setDeleteTarget}
        />
      </main>

      <EntryDrawer
        isOpen={drawerOpen}
        editingTx={editingTx}
        categories={categories}
        currency={currency}
        onCurrencyChange={handleCurrencyChange}
        isSaving={createMutation.isPending || updateMutation.isPending}
        onClose={() => {
          setDrawerOpen(false);
          setEditingTx(null);
        }}
        onSubmit={handleSaveEntry}
      />

      <ConfirmDeleteDialog
        target={deleteTarget}
        currency={currency}
        isDeleting={deleteMutation.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />

      {toast && (
        <div role="status" aria-live="polite" className="toast-banner">
          {toast}
        </div>
      )}
    </div>
  );
}

export default App;
