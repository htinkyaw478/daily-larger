export type PeriodPreset = 'today' | 'week' | 'month' | 'custom';
export type CurrencyCode = 'MMK' | 'KRW' | 'JPY';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  label: string;
  labelMy: string;
  example: string;
}

export const CURRENCY_CONFIGS: Record<CurrencyCode, CurrencyConfig> = {
  MMK: {
    code: 'MMK',
    symbol: 'Ks',
    label: 'MMK (Ks)',
    labelMy: 'မြန်မာကျပ် (Ks)',
    example: '25000',
  },
  KRW: {
    code: 'KRW',
    symbol: '₩',
    label: 'KRW (₩)',
    labelMy: 'ကိုရီးယားဝမ် (₩)',
    example: '25000',
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    label: 'JPY (¥)',
    labelMy: 'ဂျပန်ယန်း (¥)',
    example: '2500',
  },
};

export function isCurrencyCode(value: string | null | undefined): value is CurrencyCode {
  return value === 'MMK' || value === 'KRW' || value === 'JPY';
}

export function toLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getPresetDateRange(preset: Exclude<PeriodPreset, 'custom'>): {
  from: string;
  to: string;
} {
  const now = new Date();
  const to = toLocalDateString(now);

  if (preset === 'today') {
    return { from: to, to };
  }

  if (preset === 'week') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    return { from: toLocalDateString(start), to };
  }

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: toLocalDateString(monthStart), to };
}

export function formatCurrency(amount: number, currency: CurrencyCode = 'MMK'): string {
  const sign = amount < 0 ? '-' : '';
  const absFormatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(Math.abs(amount)));

  if (currency === 'MMK') {
    return `${sign}${absFormatted} Ks`;
  }
  const symbol = CURRENCY_CONFIGS[currency].symbol;
  return `${sign}${symbol}${absFormatted}`;
}

export function formatMmk(amount: number): string {
  return formatCurrency(amount, 'MMK');
}

export function formatShortDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function formatFullDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
