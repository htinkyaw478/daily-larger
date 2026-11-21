import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { I18nContext } from '../../i18n/I18nContext';
import { TRANSLATIONS } from '../../i18n/translations';
import { AppLayout, parsePageFromHash, type AppPage } from './AppLayout';

function renderLayout(page: AppPage, isAddEntryOpen = false) {
  return renderToStaticMarkup(
    <I18nContext.Provider
      value={{
        language: 'en',
        setLanguage: vi.fn(),
        t: TRANSLATIONS.en,
      }}
    >
      <AppLayout
        activePage={page}
        isAddEntryOpen={isAddEntryOpen}
        onNavigate={vi.fn()}
        sidebarCollapsed={false}
        onToggleSidebar={vi.fn()}
        theme="light"
        onToggleTheme={vi.fn()}
        preset="month"
        onPresetChange={vi.fn()}
        onOpenAdd={vi.fn()}
      >
        <div>Page body</div>
      </AppLayout>
    </I18nContext.Provider>
  );
}

describe('Requirement 06 — Mobile Bottom Navigation Visibility & Routing', () => {
  it('parses hash routes consistently across Home and secondary pages', () => {
    expect(parsePageFromHash('')).toBe('home');
    expect(parsePageFromHash('#/')).toBe('home');
    expect(parsePageFromHash('#/home')).toBe('home');
    expect(parsePageFromHash('#/ledger')).toBe('ledger');
    expect(parsePageFromHash('#/analytics')).toBe('analytics');
    expect(parsePageFromHash('#/settings')).toBe('settings');
    expect(parsePageFromHash('#/unknown')).toBe('home');
  });

  it('shows mobile bottom navigation on Home and hides mobile back button', () => {
    const html = renderLayout('home', false);
    expect(html).toContain('class="app-frame app-frame--with-bottom-nav"');
    expect(html).toContain('class="mobile-bottom-nav"');
    expect(html).toContain('class="mobile-brand-dot"');
    expect(html).not.toContain('class="mobile-topbar-back"');
    expect(html).toContain('class="app-sidebar "');
  });

  it('hides mobile bottom navigation and bottom spacing on Ledger, Analytics (Reports), and Settings while preserving desktop sidebar', () => {
    for (const page of ['ledger', 'analytics', 'settings'] as const) {
      const html = renderLayout(page, false);
      expect(html).not.toContain('class="mobile-bottom-nav"');
      expect(html).not.toContain('app-frame--with-bottom-nav');
      expect(html).toContain('class="mobile-topbar-back"');
      expect(html).toContain('class="app-sidebar "');
    }
  });

  it('hides mobile bottom navigation when Add Entry is open from Home and restores it when closed', () => {
    const withAddOpen = renderLayout('home', true);
    expect(withAddOpen).not.toContain('class="mobile-bottom-nav"');
    expect(withAddOpen).not.toContain('app-frame--with-bottom-nav');

    const backOnHome = renderLayout('home', false);
    expect(backOnHome).toContain('class="mobile-bottom-nav"');
    expect(backOnHome).toContain('app-frame app-frame--with-bottom-nav');
  });

  it('integrates header theme toggle and 3 horizontal mobile actions (Language, New Entry, Time Period)', () => {
    const html = renderLayout('home', false);
    expect(html).toContain('topbar-header-row');
    expect(html).toContain('topbar-theme-btn--mobile');
    expect(html).toContain('period-pills--desktop');
    expect(html).toContain('mobile-period-wrap');
    expect(html).toContain('mobile-period-btn');
    expect(html).toContain('>This Month</span>');
    expect(html).toContain('lucide-chevron-down');

    const langIdx = html.indexOf('topbar-lang-wrap');
    const addIdx = html.indexOf('mobile-topbar-add');
    const periodIdx = html.indexOf('mobile-period-wrap');
    expect(langIdx).toBeGreaterThan(-1);
    expect(addIdx).toBeGreaterThan(langIdx);
    expect(periodIdx).toBeGreaterThan(addIdx);

    const settingsHtml = renderLayout('settings', false);
    expect(settingsHtml).toContain('topbar-quick-switches--no-period');
    expect(settingsHtml).not.toContain('mobile-period-wrap');
  });
});
