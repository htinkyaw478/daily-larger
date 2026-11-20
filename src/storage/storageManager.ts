import { ApiStorageAdapter } from './apiAdapter';
import { IndexedDbStorageAdapter } from './indexedDbAdapter';
import {
  getPreferredMode,
  type LedgerStorage,
  savePreferredMode,
  type StorageMode,
  type StorageStatus,
} from './ledgerStorage';
import { LocalStorageAdapter } from './localStorageAdapter';

const configuredEnvApiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || '';
const devProxyFallback = import.meta.env.DEV ? '/api/v1' : '';
const resolvedApiBase = configuredEnvApiBase || devProxyFallback;

export const indexedDbAdapter = new IndexedDbStorageAdapter();
export const localStorageFallbackAdapter = new LocalStorageAdapter();
export const apiAdapter = resolvedApiBase ? new ApiStorageAdapter(resolvedApiBase) : null;

let activeMode: StorageMode | null = null;
let activeLocalEngine: 'indexeddb' | 'localstorage' = 'indexeddb';
let lastReason: StorageStatus['reason'] = resolvedApiBase ? 'api_unreachable' : 'no_api_configured';
let resolvePromise: Promise<LedgerStorage> | null = null;

async function resolveWorkingLocalAdapter(): Promise<LedgerStorage> {
  try {
    await indexedDbAdapter.ensureInitialized();
    activeLocalEngine = 'indexeddb';
    return indexedDbAdapter;
  } catch {
    activeLocalEngine = 'localstorage';
    return localStorageFallbackAdapter;
  }
}

export async function resolveStorage(forceRecheck = false): Promise<LedgerStorage> {
  if (!forceRecheck && activeMode !== null) {
    if (activeMode === 'api' && apiAdapter) return apiAdapter;
    return activeLocalEngine === 'localstorage' ? localStorageFallbackAdapter : indexedDbAdapter;
  }

  if (!forceRecheck && resolvePromise) {
    return resolvePromise;
  }

  resolvePromise = (async () => {
    const preferred = getPreferredMode();
    if (preferred === 'local' && !forceRecheck) {
      activeMode = 'local';
      lastReason = 'manual_local';
      return resolveWorkingLocalAdapter();
    }

    if (!apiAdapter) {
      activeMode = 'local';
      lastReason = 'no_api_configured';
      return resolveWorkingLocalAdapter();
    }

    const healthy = await apiAdapter.checkHealth();
    if (healthy) {
      activeMode = 'api';
      lastReason = 'api_connected';
      return apiAdapter;
    }

    activeMode = 'local';
    lastReason = 'api_unreachable';
    return resolveWorkingLocalAdapter();
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
  const engine =
    mode === 'api' ? 'api' : activeLocalEngine === 'localstorage' ? 'localstorage' : 'indexeddb';
  const fallbackDiag =
    activeLocalEngine === 'localstorage' ? localStorageFallbackAdapter.getDiagnostics() : null;
  const txCount =
    fallbackDiag !== null ? fallbackDiag.localTransactionCount : diag.localTransactionCount;
  return {
    mode,
    engine,
    reason: lastReason,
    apiConfigured: Boolean(resolvedApiBase),
    indexedDbAvailable: diag.indexedDbAvailable && activeLocalEngine === 'indexeddb',
    dbVersion: diag.dbVersion,
    persisted: diag.persisted,
    usageBytes: diag.usageBytes,
    quotaBytes: diag.quotaBytes,
    quotaPercent: diag.quotaPercent,
    quotaWarning: diag.quotaWarning,
    corruptedRecoveryKey:
      fallbackDiag?.corruptedRecoveryKey ?? diag.corruptedRecoveryKey,
    hasLocalData: txCount > 0,
    localTransactionCount: txCount,
    migratedFromLocalStorage: diag.migratedFromLocalStorage,
    hasLegacyLocalStorageData: diag.hasLegacyLocalStorageData,
    legacyLocalStorageCount: diag.legacyLocalStorageCount,
    storageError: activeLocalEngine === 'localstorage' ? null : diag.storageError,
  };
}

export async function switchStorageMode(target: StorageMode): Promise<StorageStatus> {
  if (target === 'local') {
    savePreferredMode('local');
    activeMode = 'local';
    lastReason = 'manual_local';
    await resolveWorkingLocalAdapter();
    return getStorageStatus();
  }

  savePreferredMode(null);
  await resolveStorage(true);
  return getStorageStatus();
}
