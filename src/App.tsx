import { AlertTriangle } from 'lucide-react';
import { type ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';
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
  useExecuteCsvImport,
  useImportBackup,
  usePreviewCsvImport,
  useSeedSampleData,
  useStorageStatus,
  useSwitchStorageMode,
  useTransactions,
  useUpdateTransaction,
} from './api/client';
import { ConfirmClearLegacyDialog } from './components/entry/ConfirmClearLegacyDialog';
import { ConfirmDeleteDialog } from './components/entry/ConfirmDeleteDialog';
import { ConfirmRestoreDialog } from './components/entry/ConfirmRestoreDialog';
import { EntryDrawer } from './components/entry/EntryDrawer';
import { ImportCsvDialog } from './components/entry/ImportCsvDialog';
import { AppLayout, parsePageFromHash, type AppPage } from './components/layout/AppLayout';
import { TransactionTable } from './components/ledger/TransactionTable';
import { AnalyticsPage } from './components/pages/AnalyticsPage';
import { HomePage } from './components/pages/HomePage';
import { SettingsPage } from './components/pages/SettingsPage';
import type {
  CsvImportPreview,
  CsvImportResult,
  DuplicateStrategy,
} from './domain/csvImport';
import { parseAndValidateBackupJson } from './domain/ledgerLogic';
import { usePwaInstall } from './hooks/usePwaInstall';
import { useTheme } from './hooks/useTheme';
import { I18nContext } from './i18n/I18nContext';
import { TRANSLATIONS, type LanguageCode } from './i18n/translations';
import {
  getSavedLanguagePreference,
  getSavedSidebarCollapsed,
  saveLanguagePreference,
  saveSidebarCollapsed,
} from './storage/ledgerStorage';
import type {
  CreateTransactionInput,
  Transaction,
  TransactionFilters,
  TransactionType,
} from './types/ledger';
import {
  getPresetDateRange,
  type CurrencyCode,
  type PeriodPreset,
} from './utils/formatters';

export function App() {
  const { theme, setTheme } = useTheme();
  const [language, setLanguageState] = useState<LanguageCode>(() => getSavedLanguagePreference());
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() =>
    getSavedSidebarCollapsed()
  );
  const [activePage, setActivePage] = useState<AppPage>(() =>
    typeof window !== 'undefined' ? parsePageFromHash(window.location.hash) : 'home'
  );

  const [currency, setCurrency] = useState<CurrencyCode>(() => getSavedCurrencyPreference());
  const [preset, setPreset] = useState<PeriodPreset>('month');
  const [dateRange, setDateRange] = useState(() => getPresetDateRange('month'));
  const [filters, setFilters] = useState<TransactionFilters>({
    sort: 'date_desc',
    page: 1,
    limit: 12,
  });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerInitialType, setDrawerInitialType] = useState<TransactionType>('expense');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [pendingRestore, setPendingRestore] = useState<{
    fileName: string;
    rawJson: string;
  } | null>(null);
  const [clearLegacyOpen, setClearLegacyOpen] = useState(false);
  const [csvImportState, setCsvImportState] = useState<{
    open: boolean;
    fileName: string | null;
    preview: CsvImportPreview | null;
    result: CsvImportResult | null;
    error: string | null;
  }>({
    open: false,
    fileName: null,
    preview: null,
    result: null,
    error: null,
  });
  const [corruptedDismissed, setCorruptedDismissed] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const t = TRANSLATIONS[language];

  const setLanguage = useCallback((nextLang: LanguageCode) => {
    setLanguageState(nextLang);
    saveLanguagePreference(nextLang);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = nextLang;
    }
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'daily_ledger_language' && (e.newValue === 'my' || e.newValue === 'en')) {
        setLanguageState(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      setDrawerOpen(false);
      setEditingTx(null);
      setActivePage(parsePageFromHash(window.location.hash));
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = useCallback((page: AppPage) => {
    setActivePage(page);
    if (typeof window !== 'undefined') {
      const targetHash = `#/${page}`;
      if (window.location.hash !== targetHash) {
        window.location.hash = targetHash;
      }
      window.scrollTo({ top: 0 });
    }
  }, []);

  const handleToggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      saveSidebarCollapsed(next);
      return next;
    });
  }, []);

  const handleToggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3600);
    return () => clearTimeout(timer);
  }, [toast]);

  const storageStatusQuery = useStorageStatus();
  const switchModeMutation = useSwitchStorageMode();
  const { data: categories = [] } = useCategories();
  const dashboardQuery = useDashboardSummary(dateRange.from, dateRange.to);
  const recentTransactionsQuery = useTransactions({
    from: dateRange.from,
    to: dateRange.to,
    sort: 'date_desc',
    page: 1,
    limit: 4,
  });
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
  const previewCsvMutation = usePreviewCsvImport();
  const executeCsvMutation = useExecuteCsvImport();
  const { canInstall, isInstalling, promptInstall } = usePwaInstall();

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

  const handleOpenAdd = (initialType: TransactionType = 'expense') => {
    setEditingTx(null);
    setDrawerInitialType(initialType);
    setDrawerOpen(true);
  };

  const handleOpenEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setDrawerInitialType(tx.type);
    setDrawerOpen(true);
  };

  const handleEntryBackToHome = useCallback(() => {
    setDrawerOpen(false);
    setEditingTx(null);
    handleNavigate('home');
  }, [handleNavigate]);

  const handleSaveEntry = async (payload: CreateTransactionInput, keepOpen: boolean) => {
    setActionError(null);
    if (editingTx) {
      await updateMutation.mutateAsync({ id: editingTx.id, input: payload });
      setDrawerOpen(false);
      setEditingTx(null);
      setToast(t.toasts.entryUpdated);
      return;
    }

    await createMutation.mutateAsync(payload);
    setToast(t.toasts.entrySaved);
    if (!keepOpen) {
      setDrawerOpen(false);
    }
  };

  const handleConfirmDelete = async (id: number) => {
    setActionError(null);
    try {
      await deleteMutation.mutateAsync(id);
      setDeleteTarget(null);
      setToast(t.toasts.entryDeleted);
    } catch {
      setActionError(t.errors.deleteFailed);
    }
  };

  const handleLoadSample = async () => {
    setActionError(null);
    try {
      const res = await sampleMutation.mutateAsync();
      setToast(res.inserted > 0 ? t.toasts.sampleLoaded : res.message);
    } catch {
      setActionError(t.errors.sampleFailed);
    }
  };

  const handleExportCsv = async () => {
    setActionError(null);
    try {
      await downloadTransactionsCsv(
        { ...filters, from: dateRange.from, to: dateRange.to },
        currency
      );
      setToast(t.toasts.csvExported);
    } catch {
      setActionError(t.errors.csvExportFailed);
    }
  };

  const handleBackupDownload = async () => {
    setActionError(null);
    try {
      await downloadLocalBackupJson();
      setToast(t.toasts.backupDownloaded);
    } catch {
      setActionError(t.errors.backupDownloadFailed);
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
    } catch {
      setActionError(t.errors.invalidBackupFile);
    }
  };

  const handleConfirmRestore = async () => {
    if (!pendingRestore) return;
    setActionError(null);
    try {
      const result = await importBackupMutation.mutateAsync(pendingRestore.rawJson);
      setPendingRestore(null);
      setToast(t.toasts.backupRestored(result.restoredCount));
    } catch {
      setPendingRestore(null);
      setActionError(t.errors.restoreFailed);
    }
  };

  const handleConfirmClearLegacy = async () => {
    setActionError(null);
    try {
      await clearLegacyMutation.mutateAsync();
      setClearLegacyOpen(false);
      setToast(t.toasts.legacyCleared);
    } catch {
      setClearLegacyOpen(false);
      setActionError(t.errors.clearLegacyFailed);
    }
  };

  const handleImportCsvFileSelected = async (file: File) => {
    setActionError(null);
    try {
      const buffer = await file.arrayBuffer();
      const rawText = new TextDecoder('utf-8').decode(buffer);
      const preview = await previewCsvMutation.mutateAsync(rawText);
      setCsvImportState({
        open: true,
        fileName: file.name,
        preview,
        result: null,
        error: null,
      });
    } catch (err) {
      setCsvImportState({
        open: true,
        fileName: file.name,
        preview: null,
        result: null,
        error: err instanceof Error ? err.message : t.errors.csvParseFailed,
      });
    }
  };

  const handleConfirmCsvImport = async (strategy: DuplicateStrategy) => {
    if (!csvImportState.preview) return;
    try {
      const result = await executeCsvMutation.mutateAsync({
        preview: csvImportState.preview,
        strategy,
      });
      setCsvImportState((prev) => ({ ...prev, result, error: null }));
      setToast(t.toasts.csvImported(result.insertedCount, result.updatedCount));
    } catch (err) {
      setCsvImportState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : t.errors.csvImportFailed,
      }));
    }
  };

  const handleInstallApp = async () => {
    try {
      const outcome = await promptInstall();
      if (outcome === 'accepted') {
        setToast(t.toasts.appInstalled);
      }
    } catch {
      setActionError(t.errors.installFailed);
    }
  };

  const i18nValue = useMemo(
    () => ({
      language,
      setLanguage,
      t,
    }),
    [language, setLanguage, t]
  );

  const summary = dashboardQuery.data;
  const isLocalMode = storageStatus?.mode !== 'api';

  return (
    <I18nContext.Provider value={i18nValue}>
      <AppLayout
        activePage={activePage}
        isAddEntryOpen={drawerOpen}
        onNavigate={handleNavigate}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={handleToggleSidebar}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        preset={preset}
        onPresetChange={handlePresetChange}
        onOpenAdd={() => handleOpenAdd('expense')}
      >
        {isLocalMode && storageStatus?.quotaWarning && (
          <div role="alert" className="alert-card">
            {t.settings.quotaWarning(storageStatus.quotaPercent)}
          </div>
        )}

        {isLocalMode && storageStatus?.storageError && (
          <div role="alert" className="alert-card">
            {storageStatus.storageError}
          </div>
        )}

        {storageStatus?.corruptedRecoveryKey && !corruptedDismissed && (
          <div role="alert" className="alert-card alert-card--split">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <AlertTriangle size={18} aria-hidden="true" />
              <span>{t.settings.corruptedNotice(storageStatus.corruptedRecoveryKey)}</span>
            </div>
            <button
              type="button"
              className="btn btn-secondary storage-badge-btn"
              onClick={() => {
                dismissCorruptedNotice();
                setCorruptedDismissed(true);
              }}
            >
              {t.settings.dismiss}
            </button>
          </div>
        )}

        {(dashboardQuery.isError || actionError) && (
          <div role="alert" className="alert-card">
            {actionError ?? t.errors.genericLoad}
          </div>
        )}

        {activePage === 'home' && (
          <HomePage
            summary={summary}
            recentTransactions={recentTransactionsQuery.data?.data ?? []}
            currency={currency}
            isLoading={dashboardQuery.isLoading}
            isSeedingSample={sampleMutation.isPending}
            onOpenAddWithType={(type) => handleOpenAdd(type ?? 'expense')}
            onLoadSample={handleLoadSample}
            onNavigate={handleNavigate}
          />
        )}

        {activePage === 'ledger' && (
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
            onImportCsvFile={handleImportCsvFileSelected}
          />
        )}

        {activePage === 'analytics' && (
          <AnalyticsPage
            summary={summary}
            currency={currency}
            isLoading={dashboardQuery.isLoading}
          />
        )}

        {activePage === 'settings' && (
          <SettingsPage
            theme={theme}
            onThemeChange={setTheme}
            currency={currency}
            onCurrencyChange={handleCurrencyChange}
            storageStatus={storageStatus}
            isSwitchingMode={switchModeMutation.isPending}
            onSwitchMode={(mode) => switchModeMutation.mutate(mode)}
            onBackupDownload={handleBackupDownload}
            onBackupFileSelected={handleBackupFileSelected}
            onOpenClearLegacy={() => setClearLegacyOpen(true)}
            canInstall={canInstall}
            isInstalling={isInstalling}
            onInstallApp={handleInstallApp}
          />
        )}
      </AppLayout>

      <EntryDrawer
        isOpen={drawerOpen}
        editingTx={editingTx}
        initialType={drawerInitialType}
        categories={categories}
        currency={currency}
        onCurrencyChange={handleCurrencyChange}
        isSaving={createMutation.isPending || updateMutation.isPending}
        onClose={() => {
          setDrawerOpen(false);
          setEditingTx(null);
        }}
        onBackToHome={handleEntryBackToHome}
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

      <ImportCsvDialog
        isOpen={csvImportState.open}
        fileName={csvImportState.fileName}
        preview={csvImportState.preview}
        result={csvImportState.result}
        error={csvImportState.error}
        isImporting={executeCsvMutation.isPending}
        onClose={() =>
          setCsvImportState({
            open: false,
            fileName: null,
            preview: null,
            result: null,
            error: null,
          })
        }
        onConfirmImport={handleConfirmCsvImport}
      />

      {toast && (
        <div role="status" aria-live="polite" className="toast-banner">
          {toast}
        </div>
      )}
    </I18nContext.Provider>
  );
}

export default App;
