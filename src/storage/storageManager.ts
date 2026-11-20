import { ApiStorageAdapter } from './apiAdapter';
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

export const localAdapter = new LocalStorageAdapter();
export const apiAdapter = resolvedApiBase ? new ApiStorageAdapter(resolvedApiBase) : null;

let activeMode: StorageMode | null = null;
let lastReason: StorageStatus['reason'] = resolvedApiBase ? 'api_unreachable' : 'no_api_configured';
let resolvePromise: Promise<LedgerStorage> | null = null;

export async function resolveStorage(forceRecheck = false): Promise<LedgerStorage> {
  if (!forceRecheck && activeMode !== null) {
    return activeMode === 'api' && apiAdapter ? apiAdapter : localAdapter;
  }

  if (!forceRecheck && resolvePromise) {
    return resolvePromise;
  }

  resolvePromise = (async () => {
    const preferred = getPreferredMode();
    if (preferred === 'local' && !forceRecheck) {
      activeMode = 'local';
      lastReason = 'manual_local';
      return localAdapter;
    }

    if (!apiAdapter) {
      activeMode = 'local';
      lastReason = 'no_api_configured';
      return localAdapter;
    }

    const healthy = await apiAdapter.checkHealth();
    if (healthy) {
      activeMode = 'api';
      lastReason = 'api_connected';
      return apiAdapter;
    }

    activeMode = 'local';
    lastReason = 'api_unreachable';
    return localAdapter;
  })();

  try {
    return await resolvePromise;
  } finally {
    resolvePromise = null;
  }
}

export function getStorageStatus(): StorageStatus {
  const diag = localAdapter.getDiagnostics();
  return {
    mode: activeMode ?? 'local',
    reason: lastReason,
    apiConfigured: Boolean(resolvedApiBase),
    corruptedRecoveryKey: diag.corruptedRecoveryKey,
    hasLocalData: diag.localTransactionCount > 0,
    localTransactionCount: diag.localTransactionCount,
  };
}

export async function switchStorageMode(target: StorageMode): Promise<StorageStatus> {
  if (target === 'local') {
    savePreferredMode('local');
    activeMode = 'local';
    lastReason = 'manual_local';
    return getStorageStatus();
  }

  savePreferredMode(null);
  await resolveStorage(true);
  return getStorageStatus();
}
