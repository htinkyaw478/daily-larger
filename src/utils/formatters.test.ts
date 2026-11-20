import { describe, expect, it } from 'vitest';
import { formatCurrency, formatFullDate, formatMmk, formatShortDate } from './formatters';

describe('formatters', () => {
  it('formats MMK, KRW, and JPY currencies cleanly', () => {
    expect(formatMmk(15000)).toBe('15,000 Ks');
    expect(formatCurrency(1850000, 'MMK')).toBe('1,850,000 Ks');
    expect(formatCurrency(45000, 'KRW')).toBe('₩45,000');
    expect(formatCurrency(-12000, 'KRW')).toBe('-₩12,000');
    expect(formatCurrency(12500, 'JPY')).toBe('¥12,500');
  });

  it('formats YYYY-MM-DD dates consistently without timezone drift', () => {
    expect(formatShortDate('2026-11-20')).toBe('Nov 20');
    expect(formatFullDate('2026-11-20')).toBe('Nov 20, 2026');
  });
});
