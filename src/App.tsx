import {
  AlertTriangle,
  BookOpen,
  Database,
  Download,
  HardDrive,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import {
  dismissCorruptedNotice,
  downloadLocalBackupJson,
  downloadTransactionsCsv,
  getSavedCurrencyPreference,
  saveCurrencyPreference,
  useCategories,
  useClearLegacyLocalStorage,
  useCreateTransaction,
  useDashboardSummary,
  useDeleteTransaction,
  useImportBackup,
  useSeedSampleData,
  useStorageStatus,
  useSwitchStorageMode,
  useTransactions,
  useUpdateTransaction,
} from './api/client';
import { CashFlowChart } from './components/dashboard/CashFlowChart';
import { CategoryRing } from './components/dashboard/CategoryRing';
import { KpiCards } from './components/dashboard/KpiCards';
import { ConfirmClearLegacyDialog } from './components/entry/ConfirmClearLegacyDialog';
import { ConfirmDeleteDialog } from './components/entry/ConfirmDeleteDialog';
import { ConfirmRestoreDialog } from './components/entry/ConfirmRestoreDialog';
import { EntryDrawer } from './components/entry/EntryDrawer';
import { TransactionTable } from './components/ledger/TransactionTable';
import { parseAndValidateBackupJson } from './domain/ledgerLogic';
import type {
  CreateTransactionInput,
  Transaction,
  TransactionFilters,
} from './types/ledger';
import {
  CURRENCY_CONFIGS,
  getPresetDateRange,
  type CurrencyCode,
  type PeriodPreset,
} from './utils/formatters';

function formatBytes(bytes: number | null): string {
  if (bytes === null || !Number.isFinite(bytes)) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function App() {
  const [currency, setCurrency] = useState<CurrencyCode>(() => getSavedCurrencyPreference());
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
  const [pendingRestore, setPendingRestore] = useState<{
    fileName: string;
    rawJson: string;
  } | null>(null);
  const [clearLegacyOpen, setClearLegacyOpen] = useState(false);
  const [corruptedDismissed, setCorruptedDismissed] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3600);
    return () => clearTimeout(timer);
  }, [toast]);

  const storageStatusQuery = useStorageStatus();
  const switchModeMutation = useSwitchStorageMode();
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
  const importBackupMutation = useImportBackup();
  const clearLegacyMutation = useClearLegacyLocalStorage();

  const storageStatus = storageStatusQuery.data;

  const handleCurrencyChange = (nextCurrency: CurrencyCode) => {
    setCurrency(nextCurrency);
    saveCurrencyPreference(nextCurrency);
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
    setActionError(null);
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
    setActionError(null);
    try {
      await deleteMutation.mutateAsync(id);
      setDeleteTarget(null);
      setToast('စာရင်း ဖျက်ပြီးပါပြီ · Entry removed');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to delete entry');
    }
  };

  const handleLoadSample = async () => {
    setActionError(null);
    try {
      const res = await sampleMutation.mutateAsync();
      setToast(
        res.inserted > 0
          ? 'နမူနာ စာရင်းများ ထည့်သွင်းပြီးပါပြီ · Sample data loaded'
          : res.message
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to load sample data');
    }
  };

  const handleExportCsv = async () => {
    setActionError(null);
    try {
      await downloadTransactionsCsv(
        { ...filters, from: dateRange.from, to: dateRange.to },
        currency
      );
      setToast('CSV ဖိုင် ထုတ်ယူပြီးပါပြီ · CSV exported');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'CSV export failed');
    }
  };

  const handleBackupDownload = async () => {
    setActionError(null);
    try {
      await downloadLocalBackupJson();
      setToast('Backup JSON သိမ်းဆည်းပြီးပါပြီ · Backup downloaded');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Backup download failed');
    }
  };

  const handleBackupFileSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setActionError(null);
    try {
      const rawJson = await file.text();
      parseAndValidateBackupJson(rawJson);
      setPendingRestore({ fileName: file.name, rawJson });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Invalid backup file');
    }
  };

  const handleConfirmRestore = async () => {
    if (!pendingRestore) return;
    setActionError(null);
    try {
      const result = await importBackupMutation.mutateAsync(pendingRestore.rawJson);
      setPendingRestore(null);
      setToast(`Backup ပြန်သွင်းပြီးပါပြီ · Restored ${result.restoredCount} entries`);
    } catch (err) {
      setPendingRestore(null);
      setActionError(err instanceof Error ? err.message : 'Failed to restore backup');
    }
  };

  const handleConfirmClearLegacy = async () => {
    setActionError(null);
    try {
      await clearLegacyMutation.mutateAsync();
      setClearLegacyOpen(false);
      setToast('localStorage အဟောင်းကို ရှင်းလင်းပြီးပါပြီ · Legacy copy cleared');
    } catch (err) {
      setClearLegacyOpen(false);
      setActionError(err instanceof Error ? err.message : 'Unable to clear legacy data');
    }
  };

  const summary = dashboardQuery.data;
  const showEmptyOnboarding = summary && !summary.hasAnyTransactions;
  const isLocalMode = storageStatus?.mode === 'local';

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
        {storageStatus && (
          <section className="storage-banner" aria-label="Storage Mode">
            <div className="storage-banner-info">
              {isLocalMode ? (
                <HardDrive size={18} aria-hidden="true" style={{ flexShrink: 0 }} />
              ) : (
                <Database size={18} aria-hidden="true" style={{ flexShrink: 0 }} />
              )}
              <div>
                {isLocalMode ? (
                  <>
                    <div>
                      <strong>IndexedDB Mode (v{storageStatus.dbVersion}):</strong>{' '}
                      စာရင်းများကို ဤ Browser sandbox storage ထဲတွင်သာ သိမ်းဆည်းထားပါသည် (Device များကြား auto-sync မဖြစ်ပါ — iPhone Safari တွင် Backup JSON သိမ်းထားသင့်ပါသည်)။
                    </div>
                    <div
                      className="tabular-nums"
                      style={{
                        marginTop: '0.2rem',
                        fontSize: '0.8rem',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '0.6rem',
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <ShieldCheck size={13} aria-hidden="true" />
                        Persistence:{' '}
                        {storageStatus.persisted === true
                          ? 'Granted'
                          : storageStatus.persisted === false
                            ? 'Best-effort'
                            : 'Browser-managed'}
                      </span>
                      {storageStatus.usageBytes !== null && storageStatus.quotaBytes !== null && (
                        <span>
                          Storage: {formatBytes(storageStatus.usageBytes)} /{' '}
                          {formatBytes(storageStatus.quotaBytes)}
                          {storageStatus.quotaPercent !== null ? ` (${storageStatus.quotaPercent}%)` : ''}
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <strong>PostgreSQL API Mode:</strong> Connected to server database.
                  </>
                )}
              </div>
            </div>

            <div className="storage-banner-actions">
              {isLocalMode && (
                <>
                  <button
                    type="button"
                    className="btn btn-secondary storage-badge-btn"
                    onClick={handleBackupDownload}
                  >
                    <Download size={14} aria-hidden="true" />
                    Backup JSON
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary storage-badge-btn"
                    onClick={() => restoreInputRef.current?.click()}
                  >
                    <Upload size={14} aria-hidden="true" />
                    Restore JSON
                  </button>
                  <input
                    ref={restoreInputRef}
                    type="file"
                    accept="application/json,.json"
                    className="visually-hidden"
                    aria-label="Choose backup JSON file"
                    onChange={handleBackupFileSelected}
                  />
                  {storageStatus.hasLegacyLocalStorageData && (
                    <button
                      type="button"
                      className="btn btn-secondary storage-badge-btn"
                      onClick={() => setClearLegacyOpen(true)}
                    >
                      <Trash2 size={14} aria-hidden="true" />
                      Clear Old localStorage ({storageStatus.legacyLocalStorageCount})
                    </button>
                  )}
                </>
              )}

              {isLocalMode && storageStatus.apiConfigured && (
                <button
                  type="button"
                  className="btn btn-secondary storage-badge-btn"
                  disabled={switchModeMutation.isPending}
                  onClick={() => switchModeMutation.mutate('api')}
                >
                  <RefreshCw size={14} aria-hidden="true" />
                  {switchModeMutation.isPending ? 'Checking...' : 'Retry API'}
                </button>
              )}

              {!isLocalMode && (
                <button
                  type="button"
                  className="btn btn-secondary storage-badge-btn"
                  disabled={switchModeMutation.isPending}
                  onClick={() => switchModeMutation.mutate('local')}
                >
                  <HardDrive size={14} aria-hidden="true" />
                  Use IndexedDB Mode
                </button>
              )}
            </div>
          </section>
        )}

        {isLocalMode && storageStatus?.quotaWarning && (
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
            Browser storage usage is above 80% ({storageStatus.quotaPercent}%). Please download a JSON backup and remove older records if needed.
          </div>
        )}

        {isLocalMode && storageStatus?.storageError && (
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
            {storageStatus.storageError}
          </div>
        )}

        {storageStatus?.corruptedRecoveryKey && !corruptedDismissed && (
          <div
            role="alert"
            className="card"
            style={{
              marginBottom: '1.25rem',
              borderColor: 'var(--expense-fg)',
              background: 'var(--expense-bg)',
              color: 'var(--expense-fg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <AlertTriangle size={18} aria-hidden="true" />
              <span>
                Malformed browser records were quarantined safely under{' '}
                <code>{storageStatus.corruptedRecoveryKey}</code>.
              </span>
            </div>
            <button
              type="button"
              className="btn btn-secondary storage-badge-btn"
              onClick={() => {
                dismissCorruptedNotice();
                setCorruptedDismissed(true);
              }}
            >
              Dismiss
            </button>
          </div>
        )}

        {(dashboardQuery.isError || actionError) && (
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
            {actionError ??
              (dashboardQuery.error instanceof Error
                ? dashboardQuery.error.message
                : 'Unable to load ledger data.')}
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
          onExportCsv={handleExportCsv}
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

      <ConfirmRestoreDialog
        fileName={pendingRestore?.fileName ?? null}
        existingCount={storageStatus?.localTransactionCount ?? 0}
        isRestoring={importBackupMutation.isPending}
        onCancel={() => setPendingRestore(null)}
        onConfirm={handleConfirmRestore}
      />

      <ConfirmClearLegacyDialog
        isOpen={clearLegacyOpen}
        legacyCount={storageStatus?.legacyLocalStorageCount ?? 0}
        isClearing={clearLegacyMutation.isPending}
        onCancel={() => setClearLegacyOpen(false)}
        onConfirm={handleConfirmClearLegacy}
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
