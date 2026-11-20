import { useId, useMemo, useState } from 'react';
import type { CashFlowPoint } from '../../types/ledger';
import { formatCurrency, formatShortDate, type CurrencyCode } from '../../utils/formatters';

function buildSmoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const midX = (p0.x + p1.x) / 2;
    path += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  return path;
}

export function CashFlowChart({
  data,
  currency,
  isLoading,
}: {
  data: CashFlowPoint[];
  currency: CurrencyCode;
  isLoading: boolean;
}) {
  const gradientId = useId();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const width = 680;
  const height = 260;
  const padLeft = 18;
  const padRight = 18;
  const padTop = 22;
  const padBottom = 34;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const { maxVal, incomePoints, expensePoints, incomePath, expensePath, areaPath } =
    useMemo(() => {
      const safeData = data.length > 0 ? data : [{ date: '2026-01-01', income: 0, expense: 0, net: 0 }];
      const peak = Math.max(
        10000,
        ...safeData.flatMap((d) => [d.income, d.expense])
      );
      const stepX = safeData.length > 1 ? plotW / (safeData.length - 1) : 0;

      const incPts = safeData.map((d, i) => ({
        x: safeData.length === 1 ? padLeft + plotW / 2 : padLeft + i * stepX,
        y: padTop + plotH - (d.income / peak) * plotH,
      }));
      const expPts = safeData.map((d, i) => ({
        x: safeData.length === 1 ? padLeft + plotW / 2 : padLeft + i * stepX,
        y: padTop + plotH - (d.expense / peak) * plotH,
      }));

      const incLine = buildSmoothPath(incPts);
      const expLine = buildSmoothPath(expPts);
      const baseY = padTop + plotH;
      const area =
        incPts.length > 0
          ? `${incLine} L ${incPts[incPts.length - 1].x} ${baseY} L ${incPts[0].x} ${baseY} Z`
          : '';

      return {
        maxVal: peak,
        incomePoints: incPts,
        expensePoints: expPts,
        incomePath: incLine,
        expensePath: expLine,
        areaPath: area,
      };
    }, [data, plotW, plotH]);

  const activeIndex =
    hoveredIdx !== null && hoveredIdx < data.length
      ? hoveredIdx
      : data.length > 0
        ? data.length - 1
        : null;
  const activePoint = activeIndex !== null ? data[activeIndex] : null;

  const labelStep = Math.max(1, Math.ceil(data.length / 6));

  return (
    <section className="card" aria-label="Cash-Flow Chart">
      <div className="card-header">
        <div>
          <h2 className="card-title">ငွေစီးဆင်းမှု · Cash Flow</h2>
          <p className="card-caption">Daily Income vs Expense over selected period</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.82rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: 'var(--blue-main)',
              }}
            />
            ဝင်ငွေ Income
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: 'var(--blue-deep)',
              }}
            />
            ထွက်ငွေ Expense
          </span>
        </div>
      </div>

      {activePoint && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '0.6rem 1.4rem',
            padding: '0.6rem 0.9rem',
            borderRadius: '12px',
            background: 'var(--surface-tint)',
            marginBottom: '0.85rem',
            fontSize: '0.86rem',
          }}
        >
          <strong style={{ color: 'var(--blue-deep)' }}>
            {formatShortDate(activePoint.date)}
          </strong>
          <span className="tabular-nums" style={{ color: 'var(--blue-main)', fontWeight: 600 }}>
            Income: {formatCurrency(activePoint.income, currency)}
          </span>
          <span className="tabular-nums" style={{ color: 'var(--blue-deep)', fontWeight: 600 }}>
            Expense: {formatCurrency(activePoint.expense, currency)}
          </span>
          <span className="tabular-nums" style={{ color: 'var(--text-muted)' }}>
            Net: {activePoint.net >= 0 ? '+' : ''}
            {formatCurrency(activePoint.net, currency)}
          </span>
        </div>
      )}

      <div className="chart-svg-wrap">
        {isLoading ? (
          <div style={{ height: 240, display: 'grid', placeItems: 'center', color: 'var(--text-muted)' }}>
            Loading cash flow...
          </div>
        ) : (
          <svg
            key={`${data.length}-${maxVal}`}
            viewBox={`0 0 ${width} ${height}`}
            width="100%"
            height="auto"
            role="img"
            aria-label="Animated daily cash flow chart"
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2196F3" stopOpacity="0.28" />
                <stop offset="70%" stopColor="#90CAF9" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#E3F2FD" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Subtle horizontal grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = padTop + plotH * ratio;
              return (
                <line
                  key={ratio}
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="#E3F2FD"
                  strokeWidth="1.2"
                />
              );
            })}

            {areaPath && (
              <path
                d={areaPath}
                fill={`url(#${gradientId})`}
                className="chart-area-fade"
              />
            )}

            {incomePath && (
              <path
                d={incomePath}
                fill="none"
                stroke="#2196F3"
                strokeWidth="3"
                strokeLinecap="round"
                className="chart-line-path"
              />
            )}

            {expensePath && (
              <path
                d={expensePath}
                fill="none"
                stroke="#0D47A1"
                strokeWidth="2.5"
                strokeDasharray="6 5"
                strokeLinecap="round"
                className="chart-area-fade"
              />
            )}

            {/* Hover crosshair and data points */}
            {activeIndex !== null && incomePoints[activeIndex] && expensePoints[activeIndex] && (
              <g>
                <line
                  x1={incomePoints[activeIndex].x}
                  y1={padTop}
                  x2={incomePoints[activeIndex].x}
                  y2={padTop + plotH}
                  stroke="#90CAF9"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
                <circle
                  cx={incomePoints[activeIndex].x}
                  cy={incomePoints[activeIndex].y}
                  r="5.5"
                  fill="#2196F3"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
                <circle
                  cx={expensePoints[activeIndex].x}
                  cy={expensePoints[activeIndex].y}
                  r="5"
                  fill="#0D47A1"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
              </g>
            )}

            {/* X-axis labels */}
            {data.map((d, i) => {
              if (i % labelStep !== 0 && i !== data.length - 1) return null;
              const x = incomePoints[i]?.x ?? padLeft;
              return (
                <text
                  key={d.date}
                  x={x}
                  y={height - 10}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#5C6B7A"
                  fontFamily="DM Sans, sans-serif"
                >
                  {formatShortDate(d.date)}
                </text>
              );
            })}

            {/* Invisible interactive hover columns */}
            {data.map((d, i) => {
              const x = incomePoints[i]?.x ?? padLeft;
              const colW = data.length > 1 ? plotW / (data.length - 1) : plotW;
              return (
                <rect
                  key={d.date}
                  x={Math.max(padLeft, x - colW / 2)}
                  y={padTop}
                  width={Math.max(16, colW)}
                  height={plotH}
                  fill="transparent"
                  onMouseEnter={() => setHoveredIdx(i)}
                  onFocus={() => setHoveredIdx(i)}
                />
              );
            })}
          </svg>
        )}
      </div>
    </section>
  );
}
