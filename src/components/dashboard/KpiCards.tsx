import { ArrowDownLeft, ArrowUpRight, Wallet } from 'lucide-react';
import type { DashboardSummary } from '../../types/ledger';
import { formatCurrency, type CurrencyCode } from '../../utils/formatters';

function DeltaBadge({
  delta,
  invertGood = false,
}: {
  delta: number | null;
  invertGood?: boolean;
}) {
  if (delta === null) {
    return <span className="delta-pill delta-pill--neutral">New period</span>;
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
  const income = kpis?.totalIncome ?? 0;
  const expense = kpis?.totalExpense ?? 0;
  const net = kpis?.netBalance ?? 0;

  return (
    <section aria-label="Key Financial Indicators" className="kpi-grid">
      <article className="kpi-card">
        <div className="kpi-top">
          <div>
            <div className="kpi-label">စုစုပေါင်း ဝင်ငွေ · Total Income</div>
          </div>
          <div className="kpi-icon-badge" aria-hidden="true">
            <ArrowDownLeft size={20} />
          </div>
        </div>
        <p className="kpi-value tabular-nums">
          {isLoading ? '—' : formatCurrency(income, currency)}
        </p>
        <div className="kpi-meta">
          <DeltaBadge delta={kpis?.incomeDeltaPct ?? null} />
          <span>vs previous period</span>
        </div>
      </article>

      <article className="kpi-card">
        <div className="kpi-top">
          <div>
            <div className="kpi-label">စုစုပေါင်း ထွက်ငွေ · Total Expense</div>
          </div>
          <div className="kpi-icon-badge" aria-hidden="true">
            <ArrowUpRight size={20} />
          </div>
        </div>
        <p className="kpi-value tabular-nums">
          {isLoading ? '—' : formatCurrency(expense, currency)}
        </p>
        <div className="kpi-meta">
          <DeltaBadge delta={kpis?.expenseDeltaPct ?? null} invertGood />
          <span>vs previous period</span>
        </div>
      </article>

      <article className="kpi-card kpi-card--featured">
        <div className="kpi-top">
          <div>
            <div className="kpi-label">လက်ကျန်ငွေ · Net Balance</div>
          </div>
          <div className="kpi-icon-badge" aria-hidden="true">
            <Wallet size={20} />
          </div>
        </div>
        <p className="kpi-value tabular-nums">
          {isLoading ? '—' : formatCurrency(net, currency)}
        </p>
        <div className="kpi-meta">
          <DeltaBadge delta={kpis?.netDeltaPct ?? null} />
          <span>{net >= 0 ? 'Surplus in period' : 'Deficit in period'}</span>
        </div>
      </article>
    </section>
  );
}
