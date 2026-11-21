import {
  Database,
  Download,
  Globe,
  HardDrive,
  Moon,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sun,
  Trash2,
  Upload,
} from 'lucide-react';
import { type ChangeEvent, useRef } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import type { StorageMode, StorageStatus, ThemeMode } from '../../storage/ledgerStorage';
import { CURRENCY_CONFIGS, type CurrencyCode } from '../../utils/formatters';

function formatBytes(bytes: number | null): string {
  if (bytes === null || !Number.isFinite(bytes)) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function SettingsPage({
  theme,
  onThemeChange,
  currency,
  onCurrencyChange,
  storageStatus,
  isSwitchingMode,
  onSwitchMode,
  onBackupDownload,
  onBackupFileSelected,
  onOpenClearLegacy,
  canInstall,
  isInstalling,
  onInstallApp,
}: {
  theme: ThemeMode;
  onThemeChange: (next: ThemeMode) => void;
  currency: CurrencyCode;
  onCurrencyChange: (next: CurrencyCode) => void;
  storageStatus?: StorageStatus;
  isSwitchingMode: boolean;
  onSwitchMode: (mode: StorageMode) => void;
  onBackupDownload: () => void;
  onBackupFileSelected: (e: ChangeEvent<HTMLInputElement>) => void;
  onOpenClearLegacy: () => void;
  canInstall: boolean;
  isInstalling: boolean;
  onInstallApp: () => void;
}) {
  const { language, setLanguage, t } = useI18n();
  const restoreInputRef = useRef<HTMLInputElement>(null);

  const isLocalMode = storageStatus?.mode !== 'api';

  const engineLabel =
    storageStatus?.engine === 'api'
      ? t.settings.engineApi
      : storageStatus?.engine === 'localstorage'
        ? t.settings.engineLocalStorage
        : t.settings.engineIndexedDb(storageStatus?.dbVersion ?? 2);

  const persistenceLabel =
    storageStatus?.persisted === true
      ? t.settings.persistedGranted
      : storageStatus?.persisted === false
        ? t.settings.persistedBestEffort
        : t.settings.persistedBrowserManaged;

  return (
    <div className="settings-grid">
      {/* Appearance (Theme) */}
      <section className="card" aria-labelledby="settings-appearance-title">
        <div className="card-header">
          <div>
            <h2 id="settings-appearance-title" className="card-title">
              {t.settings.appearanceTitle}
            </h2>
            <p className="card-caption">{t.settings.appearanceDesc}</p>
          </div>
        </div>

        <fieldset className="segmented-toggle" style={{ marginBottom: 0 }}>
          <legend className="visually-hidden">{t.settings.themeLabel}</legend>
          <label className="segmented-option">
            <input
              type="radio"
              name="app-theme"
              value="light"
              checked={theme === 'light'}
              onChange={() => onThemeChange('light')}
              className="visually-hidden"
            />
            <Sun size={16} aria-hidden="true" />
            <span>{t.settings.lightMode}</span>
          </label>
          <label className="segmented-option">
            <input
              type="radio"
              name="app-theme"
              value="dark"
              checked={theme === 'dark'}
              onChange={() => onThemeChange('dark')}
              className="visually-hidden"
            />
            <Moon size={16} aria-hidden="true" />
            <span>{t.settings.darkMode}</span>
          </label>
        </fieldset>
      </section>

      {/* Language */}
      <section className="card" aria-labelledby="settings-language-title">
        <div className="card-header">
          <div>
            <h2 id="settings-language-title" className="card-title">
              {t.settings.languageTitle}
            </h2>
            <p className="card-caption">{t.settings.languageDesc}</p>
          </div>
        </div>

        <fieldset className="segmented-toggle" style={{ marginBottom: 0 }}>
          <legend className="visually-hidden">{t.settings.languageLabel}</legend>
          <label className="segmented-option">
            <input
              type="radio"
              name="app-language"
              value="my"
              checked={language === 'my'}
              onChange={() => setLanguage('my')}
              className="visually-hidden"
            />
            <Globe size={16} aria-hidden="true" />
            <span>{t.settings.burmeseLabel}</span>
          </label>
          <label className="segmented-option">
            <input
              type="radio"
              name="app-language"
              value="en"
              checked={language === 'en'}
              onChange={() => setLanguage('en')}
              className="visually-hidden"
            />
            <Globe size={16} aria-hidden="true" />
            <span>{t.settings.englishLabel}</span>
          </label>
          <label className="segmented-option">
            <input
              type="radio"
              name="app-language"
              value="ko"
              checked={language === 'ko'}
              onChange={() => setLanguage('ko')}
              className="visually-hidden"
            />
            <Globe size={16} aria-hidden="true" />
            <span>{t.settings.koreanLabel}</span>
          </label>
          <label className="segmented-option">
            <input
              type="radio"
              name="app-language"
              value="ja"
              checked={language === 'ja'}
              onChange={() => setLanguage('ja')}
              className="visually-hidden"
            />
            <Globe size={16} aria-hidden="true" />
            <span>{t.settings.japaneseLabel}</span>
          </label>
        </fieldset>
      </section>

      {/* Currency */}
      <section className="card" aria-labelledby="settings-currency-title">
        <div className="card-header">
          <div>
            <h2 id="settings-currency-title" className="card-title">
              {t.settings.currencyTitle}
            </h2>
            <p className="card-caption">{t.settings.currencyDesc}</p>
          </div>
        </div>

        <label htmlFor="settings-currency-select" className="visually-hidden">
          {t.settings.currencyLabel}
        </label>
        <select
          id="settings-currency-select"
          className="form-select"
          value={currency}
          onChange={(e) => onCurrencyChange(e.target.value as CurrencyCode)}
        >
          {(Object.keys(CURRENCY_CONFIGS) as CurrencyCode[]).map((code) => (
            <option key={code} value={code}>
              {t.currencies[code]}
            </option>
          ))}
        </select>
      </section>

      {/* Storage & Backups */}
      <section className="card settings-card-wide" aria-labelledby="settings-storage-title">
        <div className="card-header">
          <div>
            <h2 id="settings-storage-title" className="card-title">
              {t.settings.storageTitle}
            </h2>
            <p className="card-caption">{t.settings.storageDesc}</p>
          </div>
          {isLocalMode ? (
            <HardDrive size={20} color="var(--text-brand)" aria-hidden="true" />
          ) : (
            <Database size={20} color="var(--text-brand)" aria-hidden="true" />
          )}
        </div>

        {storageStatus && (
          <dl className="storage-stats-list">
            <div className="storage-stat-row">
              <dt>{t.settings.engineLabel}</dt>
              <dd>{engineLabel}</dd>
            </div>
            {isLocalMode && (
              <>
                <div className="storage-stat-row">
                  <dt>{t.settings.persistenceLabel}</dt>
                  <dd style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <ShieldCheck size={15} aria-hidden="true" />
                    <span>{persistenceLabel}</span>
                  </dd>
                </div>
                <div className="storage-stat-row">
                  <dt>{t.settings.recordsCountLabel}</dt>
                  <dd className="tabular-nums">{storageStatus.localTransactionCount}</dd>
                </div>
                {storageStatus.usageBytes !== null && storageStatus.quotaBytes !== null && (
                  <div className="storage-stat-row">
                    <dt>{t.settings.quotaLabel}</dt>
                    <dd className="tabular-nums">
                      {formatBytes(storageStatus.usageBytes)} /{' '}
                      {formatBytes(storageStatus.quotaBytes)}
                      {storageStatus.quotaPercent !== null
                        ? ` (${storageStatus.quotaPercent}%)`
                        : ''}
                    </dd>
                  </div>
                )}
              </>
            )}
          </dl>
        )}

        {isLocalMode && (
          <p className="card-caption" style={{ marginTop: '0.75rem' }}>
            {t.settings.localOnlyNotice}
          </p>
        )}

        <div className="storage-banner-actions" style={{ marginTop: '1.1rem' }}>
          {isLocalMode && (
            <>
              <button type="button" className="btn btn-secondary" onClick={onBackupDownload}>
                <Download size={16} aria-hidden="true" />
                {t.settings.backupJson}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => restoreInputRef.current?.click()}
              >
                <Upload size={16} aria-hidden="true" />
                {t.settings.restoreJson}
              </button>
              <input
                ref={restoreInputRef}
                type="file"
                accept="application/json,.json"
                className="visually-hidden"
                aria-label={t.settings.restoreJson}
                onChange={onBackupFileSelected}
              />
              {storageStatus?.hasLegacyLocalStorageData && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onOpenClearLegacy}
                >
                  <Trash2 size={16} aria-hidden="true" />
                  {t.settings.clearOldLocalStorage(storageStatus.legacyLocalStorageCount)}
                </button>
              )}
            </>
          )}

          {isLocalMode && storageStatus?.apiConfigured && (
            <button
              type="button"
              className="btn btn-secondary"
              disabled={isSwitchingMode}
              onClick={() => onSwitchMode('api')}
            >
              <RefreshCw size={16} aria-hidden="true" />
              {isSwitchingMode ? t.settings.checkingApi : t.settings.retryApi}
            </button>
          )}

          {!isLocalMode && (
            <button
              type="button"
              className="btn btn-secondary"
              disabled={isSwitchingMode}
              onClick={() => onSwitchMode('local')}
            >
              <HardDrive size={16} aria-hidden="true" />
              {t.settings.useLocalMode}
            </button>
          )}

          {canInstall && (
            <button
              type="button"
              className="btn btn-primary"
              aria-disabled={isInstalling ? 'true' : undefined}
              onClick={onInstallApp}
            >
              <Smartphone size={16} aria-hidden="true" />
              {t.settings.installApp}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
