import { useState } from 'react';
import type { CategoryBreakdownItem, TransactionType } from '../../types/ledger';
import { formatCurrency, type CurrencyCode } from '../../utils/formatters';

export function CategoryRing({
  breakdown,
  currency,
  isLoading,
}: {
  breakdown?: {
    expense: CategoryBreakdownItem[];
    income: CategoryBreakdownItem[];
  };
  currency: CurrencyCode;
  isLoading: boolean;
}) {
  const [mode, setMode] = useState<TransactionType>('expense');
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const items = mode === 'expense' ? (breakdown?.expense ?? []) : (breakdown?.income ?? []);
  const total = items.reduce((acc, item) => acc + item.total, 0);
  const activeItem = items.find((item) => item.categoryId === hoveredId) ?? null;

  const size = 200;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;

  return (
    <section className="card" aria-label="Category Breakdown">
      <div className="card-header">
        <div>
          <h2 className="card-title">ကဏ္ဍခွဲခြမ်းစိတ်ဖြာမှု · Categories</h2>
          <p className="card-caption">Share by category</p>
        </div>

        <div className="period-pills" role="group" aria-label="Breakdown type">
          <button
            type="button"
            className="period-pill"
            aria-pressed={mode === 'expense'}
            onClick={() => {
              setMode('expense');
              setHoveredId(null);
            }}
          >
            ထွက်ငွေ
          </button>
          <button
            type="button"
            className="period-pill"
            aria-pressed={mode === 'income'}
            onClick={() => {
              setMode('income');
              setHoveredId(null);
            }}
          >
            ဝင်ငွေ
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ height: 220, display: 'grid', placeItems: 'center', color: 'var(--text-muted)' }}>
          Loading breakdown...
        </div>
      ) : items.length === 0 ? (
        <div
          style={{
            height: 220,
            display: 'grid',
            placeItems: 'center',
            textAlign: 'center',
            color: 'var(--text-muted)',
            background: 'var(--surface-canvas)',
            borderRadius: '14px',
            padding: '1rem',
          }}
        >
          No {mode} entries in this period yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.1rem' }}>
          <div style={{ position: 'relative', width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Category ring chart">
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#E3F2FD"
                strokeWidth={strokeWidth}
              />
              {items.map((item) => {
                const segmentLen = total > 0 ? (item.total / total) * circumference : 0;
                const dashArray = `${Math.max(0, segmentLen - 2)} ${circumference}`;
                const dashOffset = -cumulativeOffset;
                cumulativeOffset += segmentLen;
                const isHovered = hoveredId === item.categoryId;

                return (
                  <circle
                    key={item.categoryId}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={item.color}
                    strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={dashArray}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="butt"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    className="ring-segment"
                    opacity={hoveredId !== null && !isHovered ? 0.45 : 1}
                    onMouseEnter={() => setHoveredId(item.categoryId)}
                    onMouseLeave={() => setHoveredId(null)}
                  />
                );
              })}
            </svg>

            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                pointerEvents: 'none',
                padding: '1.75rem',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {activeItem ? (activeItem.nameMy ?? activeItem.name) : `Total ${mode}`}
              </span>
              <span
                className="font-display tabular-nums"
                style={{ fontSize: '1.15rem', color: 'var(--blue-deep)', lineHeight: 1.2 }}
              >
                {formatCurrency(activeItem ? activeItem.total : total, currency)}
              </span>
              {activeItem && (
                <span className="tabular-nums" style={{ fontSize: '0.75rem', color: 'var(--blue-main)', fontWeight: 600 }}>
                  {activeItem.percentage}%
                </span>
              )}
            </div>
          </div>

          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            {items.slice(0, 5).map((item) => (
              <li
                key={item.categoryId}
                onMouseEnter={() => setHoveredId(item.categoryId)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.6rem',
                  padding: '0.4rem 0.6rem',
                  borderRadius: '10px',
                  background: hoveredId === item.categoryId ? 'var(--surface-tint)' : 'transparent',
                  cursor: 'pointer',
                  fontSize: '0.86rem',
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 999,
                      background: item.color,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.nameMy ? `${item.nameMy} · ${item.name}` : item.name}
                  </span>
                </span>
                <span className="tabular-nums" style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {item.percentage}% · {formatCurrency(item.total, currency)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
