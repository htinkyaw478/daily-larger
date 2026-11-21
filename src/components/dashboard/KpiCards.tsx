import { ArrowDownLeft, ArrowUpRight, Wallet } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import type { DashboardSummary } from '../../types/ledger';
import { formatCurrency, type CurrencyCode } from '../../utils/formatters';

function DeltaBadge({
  delta,
  newPeriodLabel,
  invertGood = false,
}: {
  delta: number | null;
  newPeriodLabel: string;
  invertGood?: boolean;
}) {
  if (delta === null) {
    return <span className="delta-pill delta-pill--neutral">{newPeriodLabel}</span>;
  }

  const isPositive = delta >= 0;
  const isGood = invertGood ? !isPositive : isPositive;
  const sign = isPositive ? '+' : '';

  return (
    <span className={`delta-pill ${isGood ? 'delta-pill--up' : 'delta-pill--down'} tabular-nums`}>
      {sign}
      {delta}%
    </span>
  );
}

export function KpiCards({
  kpis,
  currency,
  isLoading,
}: {
  kpis?: DashboardSummary['kpis'];
  currency: CurrencyCode;
  isLoading: boolean;
}) {
  const { t } = useI18n();
  const income = kpis?.totalIncome ?? 0;
  const expense = kpis?.totalExpense ?? 0;
  const net = kpis?.netBalance ?? 0;

  return (
    <section aria-label={t.kpi.sectionLabel} className="kpi-grid">
      <article className="kpi-card">
        <div className="kpi-top">
          <div>
            <div className="kpi-label">{t.kpi.totalIncome}</div>
          </div>
          <div className="kpi-icon-badge" aria-hidden="true">
            <ArrowDownLeft size={20} />
          </div>
        </div>
        <p className="kpi-value tabular-nums">
          {isLoading ? '—' : formatCurrency(income, currency)}
        </p>
        <div className="kpi-meta">
          <DeltaBadge delta={kpis?.incomeDeltaPct ?? null} newPeriodLabel={t.kpi.newPeriod} />
          <span>{t.kpi.vsPrevious}</span>
        </div>
      </article>

      <article className="kpi-card">
        <div className="kpi-top">
          <div>
            <div className="kpi-label">{t.kpi.totalExpense}</div>
          </div>
          <div className="kpi-icon-badge" aria-hidden="true">
            <ArrowUpRight size={20} />
          </div>
        </div>
        <p className="kpi-value tabular-nums">
          {isLoading ? '—' : formatCurrency(expense, currency)}
        </p>
        <div className="kpi-meta">
          <DeltaBadge
            delta={kpis?.expenseDeltaPct ?? null}
            newPeriodLabel={t.kpi.newPeriod}
            invertGood
          />
          <span>{t.kpi.vsPrevious}</span>
        </div>
      </article>

      <article className="kpi-card kpi-card--featured">
        <div className="kpi-top">
          <div>
            <div className="kpi-label">{t.kpi.netBalance}</div>
          </div>
          <div className="kpi-icon-badge" aria-hidden="true">
            <Wallet size={20} />
          </div>
        </div>
        <p className="kpi-value tabular-nums">
          {isLoading ? '—' : formatCurrency(net, currency)}
        </p>
        <div className="kpi-meta">
          <DeltaBadge delta={kpis?.netDeltaPct ?? null} newPeriodLabel={t.kpi.newPeriod} />
          <span>{net >= 0 ? t.kpi.surplus : t.kpi.deficit}</span>
        </div>
      </article>
    </section>
  );
}
