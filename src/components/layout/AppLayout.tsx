import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Globe,
  Home,
  ListOrdered,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
  Sun,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import type { LanguageCode } from '../../i18n/translations';
import type { ThemeMode } from '../../storage/ledgerStorage';
import type { PeriodPreset } from '../../utils/formatters';

export type AppPage = 'home' | 'ledger' | 'analytics' | 'settings';

export function parsePageFromHash(hash: string): AppPage {
  const cleaned = hash.replace(/^#\/?/, '').trim().toLowerCase();
  if (cleaned === 'ledger' || cleaned === 'analytics' || cleaned === 'settings') {
    return cleaned;
  }
  return 'home';
}

interface NavItem {
  id: AppPage;
  label: string;
  icon: typeof Home;
}

export function AppLayout({
  activePage,
  isAddEntryOpen = false,
  onNavigate,
  sidebarCollapsed,
  onToggleSidebar,
  theme,
  onToggleTheme,
  preset,
  onPresetChange,
  onOpenAdd,
  children,
}: {
  activePage: AppPage;
  isAddEntryOpen?: boolean;
  onNavigate: (page: AppPage) => void;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  preset: PeriodPreset;
  onPresetChange: (preset: Exclude<PeriodPreset, 'custom'>) => void;
  onOpenAdd: () => void;
  children: ReactNode;
}) {
  const { language, setLanguage, t } = useI18n();
  const showMobileBottomNav = activePage === 'home' && !isAddEntryOpen;

  const navItems: NavItem[] = [
    { id: 'home', label: t.nav.home, icon: Home },
    { id: 'ledger', label: t.nav.ledger, icon: ListOrdered },
    { id: 'analytics', label: t.nav.analytics, icon: BarChart3 },
    { id: 'settings', label: t.nav.settings, icon: Settings },
  ];

  const pageMeta: Record<AppPage, { title: string; subtitle: string }> = {
    home: { title: t.home.title, subtitle: t.home.subtitle },
    ledger: { title: t.ledger.title, subtitle: t.ledger.subtitle },
    analytics: { title: t.analytics.title, subtitle: t.analytics.subtitle },
    settings: { title: t.settings.title, subtitle: t.settings.subtitle },
  };

  const currentMeta = pageMeta[activePage];
  const showPeriodSelector = activePage !== 'settings';

  return (
    <div
      className={`app-frame${sidebarCollapsed ? ' app-frame--collapsed' : ''}${
        showMobileBottomNav ? ' app-frame--with-bottom-nav' : ''
      }`}
    >
      <a href="#main-content" className="visually-hidden skip-link">
        {t.app.skipToContent}
      </a>

      {/* Persistent Collapsible Desktop Sidebar */}
      <aside
        className={`app-sidebar ${sidebarCollapsed ? 'app-sidebar--collapsed' : ''}`}
        aria-label={t.nav.primaryLabel}
      >
        <div className="sidebar-brand">
          <div className="brand-mark" aria-hidden="true">
            <BookOpen size={22} />
          </div>
          {!sidebarCollapsed && (
            <div className="sidebar-brand-text">
              <span className="sidebar-brand-title">{t.app.name}</span>
              <span className="sidebar-brand-sub">{t.app.subtitle}</span>
            </div>
          )}
        </div>

        <button
          type="button"
          className="btn btn-primary sidebar-add-btn"
          onClick={onOpenAdd}
          aria-label={t.nav.addEntry}
          title={sidebarCollapsed ? t.nav.addEntry : undefined}
        >
          <Plus size={18} aria-hidden="true" />
          {!sidebarCollapsed && <span>{t.nav.addEntry}</span>}
        </button>

        <nav className="sidebar-nav" aria-label={t.nav.primaryLabel}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className="sidebar-nav-item"
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
                title={sidebarCollapsed ? item.label : undefined}
                onClick={() => onNavigate(item.id)}
              >
                <Icon size={20} aria-hidden="true" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={onToggleSidebar}
            aria-label={sidebarCollapsed ? t.nav.expandSidebar : t.nav.collapseSidebar}
            title={sidebarCollapsed ? t.nav.expandSidebar : t.nav.collapseSidebar}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen size={18} aria-hidden="true" />
            ) : (
              <>
                <PanelLeftClose size={18} aria-hidden="true" />
                <span>{t.nav.collapseSidebar}</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Independent Main Content Area */}
      <div className="app-main-wrap">
        <header className="main-topbar">
          <div className="topbar-heading-group">
            {activePage === 'home' ? (
              <div className="mobile-brand-dot" aria-hidden="true">
                <BookOpen size={18} />
              </div>
            ) : (
              <button
                type="button"
                className="mobile-topbar-back"
                aria-label={t.entry.backAria}
                onClick={() => onNavigate('home')}
              >
                <ArrowLeft size={21} aria-hidden="true" />
              </button>
            )}
            <div>
              <h1 className="topbar-title">{currentMeta.title}</h1>
              <p className="topbar-subtitle">{currentMeta.subtitle}</p>
            </div>
          </div>

          <div className="topbar-controls">
            {showPeriodSelector && (
              <div className="period-pills" role="group" aria-label={t.periods.groupLabel}>
                <button
                  type="button"
                  className="period-pill"
                  aria-pressed={preset === 'today'}
                  onClick={() => onPresetChange('today')}
                >
                  {t.periods.today}
                </button>
                <button
                  type="button"
                  className="period-pill"
                  aria-pressed={preset === 'week'}
                  onClick={() => onPresetChange('week')}
                >
                  {t.periods.week}
                </button>
                <button
                  type="button"
                  className="period-pill"
                  aria-pressed={preset === 'month'}
                  onClick={() => onPresetChange('month')}
                >
                  {t.periods.month}
                </button>
              </div>
            )}

            <div className="topbar-quick-switches">
              <div className="topbar-lang-wrap">
                <Globe size={15} className="topbar-lang-icon" aria-hidden="true" />
                <select
                  aria-label={t.settings.languageLabel}
                  title={t.settings.languageLabel}
                  className="control-select topbar-lang-select"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                >
                  <option value="my">{t.settings.burmeseLabel}</option>
                  <option value="en">{t.settings.englishLabel}</option>
                  <option value="ko">{t.settings.koreanLabel}</option>
                  <option value="ja">{t.settings.japaneseLabel}</option>
                </select>
              </div>

              <button
                type="button"
                className="btn btn-secondary icon-pill-btn"
                aria-label={
                  theme === 'dark' ? t.settings.lightMode : t.settings.darkMode
                }
                title={theme === 'dark' ? t.settings.lightMode : t.settings.darkMode}
                onClick={onToggleTheme}
              >
                {theme === 'dark' ? (
                  <Sun size={16} aria-hidden="true" />
                ) : (
                  <Moon size={16} aria-hidden="true" />
                )}
              </button>

              <button
                type="button"
                className="btn btn-primary mobile-topbar-add"
                onClick={onOpenAdd}
                aria-label={t.nav.addEntry}
              >
                <Plus size={17} aria-hidden="true" />
                <span>{t.nav.addEntry}</span>
              </button>
            </div>
          </div>
        </header>

        <main id="main-content" className="app-main-content">
          {children}
        </main>
      </div>

      {/* Fixed Mobile Bottom Navigation Bar (Home only) */}
      {showMobileBottomNav && (
        <nav className="mobile-bottom-nav" aria-label={t.nav.primaryLabel}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                className="mobile-bottom-nav-item"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onNavigate(item.id)}
              >
                <span className="mobile-nav-pill">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <span className="mobile-nav-label">{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
