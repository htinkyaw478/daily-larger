import { ApiStorageAdapter } from './apiAdapter';
import { IndexedDbStorageAdapter } from './indexedDbAdapter';
import {
  getPreferredMode,
  type LedgerStorage,
  savePreferredMode,
  type StorageMode,
  type StorageStatus,
} from './ledgerStorage';

const configuredEnvApiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || '';
const devProxyFallback = import.meta.env.DEV ? '/api/v1' : '';
const resolvedApiBase = configuredEnvApiBase || devProxyFallback;

export const indexedDbAdapter = new IndexedDbStorageAdapter();
export const apiAdapter = resolvedApiBase ? new ApiStorageAdapter(resolvedApiBase) : null;

let activeMode: StorageMode | null = null;
let lastReason: StorageStatus['reason'] = resolvedApiBase ? 'api_unreachable' : 'no_api_configured';
let resolvePromise: Promise<LedgerStorage> | null = null;

export async function resolveStorage(forceRecheck = false): Promise<LedgerStorage> {
  if (!forceRecheck && activeMode !== null) {
    return activeMode === 'api' && apiAdapter ? apiAdapter : indexedDbAdapter;
  }

  if (!forceRecheck && resolvePromise) {
    return resolvePromise;
  }

  resolvePromise = (async () => {
    const preferred = getPreferredMode();
    if (preferred === 'local' && !forceRecheck) {
      activeMode = 'local';
      lastReason = 'manual_local';
      await indexedDbAdapter.ensureInitialized().catch(() => undefined);
      return indexedDbAdapter;
    }

    if (!apiAdapter) {
      activeMode = 'local';
      lastReason = 'no_api_configured';
      await indexedDbAdapter.ensureInitialized().catch(() => undefined);
      return indexedDbAdapter;
    }

    const healthy = await apiAdapter.checkHealth();
    if (healthy) {
      activeMode = 'api';
      lastReason = 'api_connected';
      return apiAdapter;
    }

    activeMode = 'local';
    lastReason = 'api_unreachable';
    await indexedDbAdapter.ensureInitialized().catch(() => undefined);
    return indexedDbAdapter;
  })();

  try {
    return await resolvePromise;
  } finally {
    resolvePromise = null;
  }
}

export async function getStorageStatus(): Promise<StorageStatus> {
  const diag = await indexedDbAdapter.getDiagnostics();
  const mode = activeMode ?? 'local';
  return {
    mode,
    engine: mode === 'api' ? 'api' : 'indexeddb',
    reason: lastReason,
    apiConfigured: Boolean(resolvedApiBase),
    indexedDbAvailable: diag.indexedDbAvailable,
    dbVersion: diag.dbVersion,
    persisted: diag.persisted,
    usageBytes: diag.usageBytes,
    quotaBytes: diag.quotaBytes,
    quotaPercent: diag.quotaPercent,
    quotaWarning: diag.quotaWarning,
    corruptedRecoveryKey: diag.corruptedRecoveryKey,
    hasLocalData: diag.localTransactionCount > 0,
    localTransactionCount: diag.localTransactionCount,
    migratedFromLocalStorage: diag.migratedFromLocalStorage,
    hasLegacyLocalStorageData: diag.hasLegacyLocalStorageData,
    legacyLocalStorageCount: diag.legacyLocalStorageCount,
    storageError: diag.storageError,
  };
}

export async function switchStorageMode(target: StorageMode): Promise<StorageStatus> {
  if (target === 'local') {
    savePreferredMode('local');
    activeMode = 'local';
    lastReason = 'manual_local';
    await indexedDbAdapter.ensureInitialized().catch(() => undefined);
    return getStorageStatus();
  }

  savePreferredMode(null);
  await resolveStorage(true);
  return getStorageStatus();
}
