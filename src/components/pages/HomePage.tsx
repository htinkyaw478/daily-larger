import { ArrowRight, Plus, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import {
  formatLocalizedShortDate,
  getCategoryLabel,
} from '../../i18n/translations';
import type { DashboardSummary, Transaction, TransactionType } from '../../types/ledger';
import { formatCurrency, type CurrencyCode } from '../../utils/formatters';
import { KpiCards } from '../dashboard/KpiCards';
import { CategoryIcon } from '../ui/CategoryIcon';
import type { AppPage } from '../layout/AppLayout';

export function HomePage({
  summary,
  recentTransactions,
  currency,
  isLoading,
  isSeedingSample,
  onOpenAddWithType,
  onLoadSample,
  onNavigate,
}: {
  summary?: DashboardSummary;
  recentTransactions: Transaction[];
  currency: CurrencyCode;
  isLoading: boolean;
  isSeedingSample: boolean;
  onOpenAddWithType: (type?: TransactionType) => void;
  onLoadSample: () => void;
  onNavigate: (page: AppPage) => void;
}) {
  const { language, t } = useI18n();
  const showEmptyOnboarding = summary && !summary.hasAnyTransactions;

  const totalIncome = summary?.kpis.totalIncome ?? 0;
  const totalExpense = summary?.kpis.totalExpense ?? 0;
  const totalVolume = totalIncome + totalExpense;
  const incomePct = totalVolume > 0 ? Math.round((totalIncome / totalVolume) * 100) : 50;
  const expenseRatio =
    totalIncome > 0 ? Math.min(999, Math.round((totalExpense / totalIncome) * 100)) : 0;
  const topCategories = (summary?.categoryBreakdown.expense ?? []).slice(0, 3);

  return (
    <div className="page-stack">
      {showEmptyOnboarding && (
        <section className="empty-hero" aria-label={t.home.welcomeTitle}>
          <div>
            <h2>{t.home.welcomeTitle}</h2>
            <p>{t.home.welcomeDesc}</p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onOpenAddWithType('expense')}
            >
              <Plus size={18} aria-hidden="true" />
              {t.home.addFirstEntry}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={isSeedingSample}
              onClick={onLoadSample}
            >
              <Sparkles size={17} aria-hidden="true" />
              {isSeedingSample ? t.home.loadingSample : t.home.loadSampleData}
            </button>
          </div>
        </section>
      )}

      <KpiCards kpis={summary?.kpis} currency={currency} isLoading={isLoading} />

      <section className="home-summary-grid" aria-label={t.home.quickActionsTitle}>
        {/* Concise Cash-Flow Pulse & Quick Actions */}
        <article className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">{t.home.cashFlowPulseTitle}</h2>
              <p className="card-caption">
                {t.home.expenseRatio}:{' '}
                <strong className="tabular-nums">{expenseRatio}%</strong>
              </p>
            </div>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => onNavigate('analytics')}
            >
              <span>{t.home.openAnalytics}</span>
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>

          <div className="pulse-bar-wrap" aria-hidden="true">
            <div className="pulse-bar-track">
              <div
                className="pulse-bar-income"
                style={{ width: `${totalVolume > 0 ? incomePct : 0}%` }}
              />
            </div>
            <div className="pulse-bar-legend tabular-nums">
              <span>
                {t.home.incomeShare}: {formatCurrency(totalIncome, currency)}
              </span>
              <span>
                {t.home.expenseShare}: {formatCurrency(totalExpense, currency)}
              </span>
            </div>
          </div>

          {topCategories.length > 0 && (
            <div className="home-top-categories">
              <h3 className="home-sublabel">{t.home.topCategoriesTitle}</h3>
              <ul className="compact-cat-list">
                {topCategories.map((cat) => (
                  <li key={cat.categoryId} className="compact-cat-item">
                    <span className="compact-cat-name">
                      <span
                        className="cat-color-dot"
                        style={{ backgroundColor: cat.color }}
                        aria-hidden="true"
                      />
                      <span>
                        {getCategoryLabel(
                          { name: cat.name, nameMy: cat.nameMy },
                          language
                        )}
                      </span>
                    </span>
                    <span className="tabular-nums" style={{ fontWeight: 600 }}>
                      {cat.percentage}% · {formatCurrency(cat.total, currency)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="quick-actions-row">
            <button
              type="button"
              className="btn btn-secondary quick-action-btn"
              onClick={() => onOpenAddWithType('income')}
            >
              <TrendingUp size={16} aria-hidden="true" />
              {t.home.addNewIncome}
            </button>
            <button
              type="button"
              className="btn btn-secondary quick-action-btn"
              onClick={() => onOpenAddWithType('expense')}
            >
              <TrendingDown size={16} aria-hidden="true" />
              {t.home.addNewExpense}
            </button>
          </div>
        </article>

        {/* Concise Recent Activity Preview */}
        <article className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">{t.home.recentTransactions}</h2>
              <p className="card-caption">{t.home.subtitle}</p>
            </div>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => onNavigate('ledger')}
            >
              <span>{t.home.viewAll}</span>
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="empty-mini-box">{t.home.noRecent}</div>
          ) : (
            <ul className="recent-list">
              {recentTransactions.slice(0, 4).map((tx) => (
                <li key={tx.id} className="recent-row">
                  <div className="recent-row-left">
                    <span
                      className="category-dot"
                      style={{
                        background: `${tx.category.color}1a`,
                        color: tx.category.color,
                      }}
                    >
                      <CategoryIcon name={tx.category.icon} size={15} />
                    </span>
                    <div className="recent-row-meta">
                      <span className="recent-row-cat">
                        {getCategoryLabel(tx.category, language)}
                      </span>
                      <span className="recent-row-date tabular-nums">
                        {formatLocalizedShortDate(tx.transactionDate, language)}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`tabular-nums recent-row-amount ${
                      tx.type === 'income' ? 'amount-income' : 'amount-expense'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}
                    {formatCurrency(tx.amount, currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: '100%' }}
              onClick={() => onNavigate('ledger')}
            >
              <span>{t.home.openLedger}</span>
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </article>
      </section>
    </div>
  );
}
