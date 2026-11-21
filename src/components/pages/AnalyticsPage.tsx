import type { DashboardSummary } from '../../types/ledger';
import type { CurrencyCode } from '../../utils/formatters';
import { CashFlowChart } from '../dashboard/CashFlowChart';
import { CategoryRing } from '../dashboard/CategoryRing';

export function AnalyticsPage({
  summary,
  currency,
  isLoading,
}: {
  summary?: DashboardSummary;
  currency: CurrencyCode;
  isLoading: boolean;
}) {
  return (
    <div className="page-stack">
      <div className="charts-grid">
        <CashFlowChart
          data={summary?.cashFlow ?? []}
          currency={currency}
          isLoading={isLoading}
        />
        <CategoryRing
          breakdown={summary?.categoryBreakdown}
          currency={currency}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
