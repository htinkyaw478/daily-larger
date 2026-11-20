import type {
  CashFlowPoint,
  Category,
  CategoryBreakdownItem,
  CreateTransactionInput,
  DashboardSummary,
  Transaction,
  TransactionFilters,
  TransactionsResponse,
  TransactionType,
} from '../types/ledger';
import type { CurrencyCode } from '../utils/formatters';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 1, name: 'Salary', nameMy: 'လစာ', type: 'income', icon: 'briefcase', color: '#0D47A1', isDefault: true },
  { id: 2, name: 'Sales', nameMy: 'ရောင်းရငွေ', type: 'income', icon: 'store', color: '#2196F3', isDefault: true },
  { id: 3, name: 'Freelance', nameMy: 'အလွတ်တန်းဝင်ငွေ', type: 'income', icon: 'laptop', color: '#1976D2', isDefault: true },
  { id: 4, name: 'Investment', nameMy: 'ရင်းနှီးမြှုပ်နှံမှု', type: 'income', icon: 'trending-up', color: '#0F9D58', isDefault: true },
  { id: 5, name: 'Other Income', nameMy: 'အခြားဝင်ငွေ', type: 'income', icon: 'plus-circle', color: '#64B5F6', isDefault: true },
  { id: 6, name: 'Food & Dining', nameMy: 'အစားအသောက်', type: 'expense', icon: 'utensils', color: '#2196F3', isDefault: true },
  { id: 7, name: 'Transport', nameMy: 'ခရီးသွားလာရေး', type: 'expense', icon: 'car', color: '#0D47A1', isDefault: true },
  { id: 8, name: 'Bills & Utilities', nameMy: 'မီတာနှင့် ဘေလ်များ', type: 'expense', icon: 'receipt', color: '#1976D2', isDefault: true },
  { id: 9, name: 'Shopping', nameMy: 'ဈေးဝယ်', type: 'expense', icon: 'shopping-bag', color: '#42A5F5', isDefault: true },
  { id: 10, name: 'Health', nameMy: 'ကျန်းမာရေး', type: 'expense', icon: 'heart', color: '#00897B', isDefault: true },
  { id: 11, name: 'Home & Rent', nameMy: 'အိမ်ငှားနှင့် အိမ်သုံး', type: 'expense', icon: 'home', color: '#1565C0', isDefault: true },
  { id: 12, name: 'Other Expense', nameMy: 'အခြားထွက်ငွေ', type: 'expense', icon: 'tag', color: '#90CAF9', isDefault: true },
];

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseDateOnlyUtc(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function formatDateOnlyUtc(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function getDefaultMonthRangeUtc(now: Date = new Date()): { from: string; to: string } {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return {
    from: formatDateOnlyUtc(start),
    to: formatDateOnlyUtc(end),
  };
}

export function getPreviousPeriodRange(fromStr: string, toStr: string): { from: string; to: string } {
  const from = parseDateOnlyUtc(fromStr);
  const to = parseDateOnlyUtc(toStr);
  const spanDays = Math.max(1, Math.round((to.getTime() - from.getTime()) / MS_PER_DAY) + 1);
  const prevTo = new Date(from.getTime() - MS_PER_DAY);
  const prevFrom = new Date(prevTo.getTime() - (spanDays - 1) * MS_PER_DAY);
  return {
    from: formatDateOnlyUtc(prevFrom),
    to: formatDateOnlyUtc(prevTo),
  };
}

export function enumerateDateStrings(fromStr: string, toStr: string): string[] {
  const start = parseDateOnlyUtc(fromStr);
  const end = parseDateOnlyUtc(toStr);
  const dates: string[] = [];
  for (let ms = start.getTime(); ms <= end.getTime(); ms += MS_PER_DAY) {
    dates.push(formatDateOnlyUtc(new Date(ms)));
  }
  return dates;
}

export function validateCreateTransactionInput(
  input: CreateTransactionInput,
  categories: Category[]
): CreateTransactionInput {
  if (input.type !== 'income' && input.type !== 'expense') {
    throw new Error('Transaction type must be income or expense');
  }
  if (!Number.isFinite(input.amount) || input.amount <= 0 || input.amount > 999999999999.99) {
    throw new Error('Amount must be greater than 0 and within valid limits');
  }
  if (!DATE_RE.test(input.transactionDate)) {
    throw new Error('Date must be in YYYY-MM-DD format');
  }
  const category = categories.find((c) => c.id === input.categoryId);
  if (!category) {
    throw new Error('Selected category does not exist');
  }
  if (category.type !== input.type) {
    throw new Error(`Category "${category.name}" belongs to ${category.type}, not ${input.type}`);
  }
  const paymentMethod = input.paymentMethod.trim() || 'Cash';
  const note = input.note?.trim() ? input.note.trim().slice(0, 255) : null;

  return {
    type: input.type,
    amount: Number(input.amount.toFixed(2)),
    categoryId: input.categoryId,
    transactionDate: input.transactionDate,
    paymentMethod: paymentMethod.slice(0, 50),
    note,
  };
}

export function filterAndSortTransactions(
  transactions: Transaction[],
  filters: TransactionFilters
): Transaction[] {
  const search = filters.search?.trim().toLowerCase() ?? '';

  const filtered = transactions.filter((tx) => {
    if (filters.type && tx.type !== filters.type) return false;
    if (filters.categoryId && tx.categoryId !== filters.categoryId) return false;
    if (filters.from && tx.transactionDate < filters.from) return false;
    if (filters.to && tx.transactionDate > filters.to) return false;

    if (search) {
      const haystack = [
        tx.note ?? '',
        tx.paymentMethod,
        tx.category.name,
        tx.category.nameMy ?? '',
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });

  const sort = filters.sort ?? 'date_desc';
  return [...filtered].sort((a, b) => {
    switch (sort) {
      case 'date_asc':
        return a.transactionDate.localeCompare(b.transactionDate) || a.id - b.id;
      case 'amount_desc':
        return b.amount - a.amount || b.transactionDate.localeCompare(a.transactionDate);
      case 'amount_asc':
        return a.amount - b.amount || b.transactionDate.localeCompare(a.transactionDate);
      case 'date_desc':
      default:
        return b.transactionDate.localeCompare(a.transactionDate) || b.id - a.id;
    }
  });
}

export function paginateTransactions(
  items: Transaction[],
  page: number = 1,
  limit: number = 20
): TransactionsResponse {
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, Math.min(100, limit));
  const start = (safePage - 1) * safeLimit;
  return {
    data: items.slice(start, start + safeLimit),
    meta: {
      page: safePage,
      limit: safeLimit,
      total: items.length,
    },
  };
}

function computeDeltaPct(current: number, previous: number): number | null {
  if (previous === 0) {
    return current === 0 ? 0 : null;
  }
  return Number((((current - previous) / Math.abs(previous)) * 100).toFixed(1));
}

function buildCategoryBreakdown(
  rows: Transaction[],
  targetType: TransactionType
): CategoryBreakdownItem[] {
  const filtered = rows.filter((r) => r.type === targetType);
  const grandTotal = filtered.reduce((acc, item) => acc + item.amount, 0);
  const map = new Map<number, CategoryBreakdownItem>();

  for (const row of filtered) {
    const existing = map.get(row.category.id);
    if (existing) {
      existing.total += row.amount;
      existing.count += 1;
    } else {
      map.set(row.category.id, {
        categoryId: row.category.id,
        name: row.category.name,
        nameMy: row.category.nameMy,
        icon: row.category.icon,
        color: row.category.color,
        total: row.amount,
        percentage: 0,
        count: 1,
      });
    }
  }

  return Array.from(map.values())
    .map((item) => ({
      ...item,
      total: Number(item.total.toFixed(2)),
      percentage: grandTotal > 0 ? Number(((item.total / grandTotal) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

export function computeDashboardSummary(
  allTransactions: Transaction[],
  fromParam?: string,
  toParam?: string
): DashboardSummary {
  const fallback = getDefaultMonthRangeUtc();
  const from = fromParam ?? fallback.from;
  const to = toParam ?? fallback.to;
  const prev = getPreviousPeriodRange(from, to);

  const currentRows = allTransactions.filter(
    (tx) => tx.transactionDate >= from && tx.transactionDate <= to
  );
  const prevRows = allTransactions.filter(
    (tx) => tx.transactionDate >= prev.from && tx.transactionDate <= prev.to
  );

  let totalIncome = 0;
  let totalExpense = 0;
  const dailyMap = new Map<string, { income: number; expense: number }>();

  for (const dateStr of enumerateDateStrings(from, to)) {
    dailyMap.set(dateStr, { income: 0, expense: 0 });
  }

  for (const tx of currentRows) {
    const bucket = dailyMap.get(tx.transactionDate) ?? { income: 0, expense: 0 };
    if (tx.type === 'income') {
      totalIncome += tx.amount;
      bucket.income += tx.amount;
    } else {
      totalExpense += tx.amount;
      bucket.expense += tx.amount;
    }
    dailyMap.set(tx.transactionDate, bucket);
  }

  let prevIncome = 0;
  let prevExpense = 0;
  for (const tx of prevRows) {
    if (tx.type === 'income') prevIncome += tx.amount;
    else prevExpense += tx.amount;
  }

  const netBalance = totalIncome - totalExpense;
  const prevNet = prevIncome - prevExpense;

  const cashFlow: CashFlowPoint[] = Array.from(dailyMap.entries()).map(([date, vals]) => ({
    date,
    income: Number(vals.income.toFixed(2)),
    expense: Number(vals.expense.toFixed(2)),
    net: Number((vals.income - vals.expense).toFixed(2)),
  }));

  return {
    period: { from, to, previousFrom: prev.from, previousTo: prev.to },
    kpis: {
      totalIncome: Number(totalIncome.toFixed(2)),
      totalExpense: Number(totalExpense.toFixed(2)),
      netBalance: Number(netBalance.toFixed(2)),
      incomeDeltaPct: computeDeltaPct(totalIncome, prevIncome),
      expenseDeltaPct: computeDeltaPct(totalExpense, prevExpense),
      netDeltaPct: computeDeltaPct(netBalance, prevNet),
    },
    cashFlow,
    categoryBreakdown: {
      expense: buildCategoryBreakdown(currentRows, 'expense'),
      income: buildCategoryBreakdown(currentRows, 'income'),
    },
    hasAnyTransactions: allTransactions.length > 0,
  };
}

export function buildSampleTransactionInputs(
  categories: Category[],
  now: Date = new Date()
): CreateTransactionInput[] {
  const findCatId = (name: string, type: TransactionType) =>
    categories.find((c) => c.name === name && c.type === type)?.id ??
    categories.find((c) => c.type === type)?.id;

  const daysAgo = (n: number) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - n));
    return formatDateOnlyUtc(d);
  };

  const specs: Array<{
    daysBack: number;
    type: TransactionType;
    catName: string;
    amount: number;
    paymentMethod: string;
    note: string;
  }> = [
    { daysBack: 12, type: 'income', catName: 'Salary', amount: 1850000, paymentMethod: 'Bank Transfer', note: 'လစာဝင်ငွေ (Monthly salary)' },
    { daysBack: 11, type: 'expense', catName: 'Home & Rent', amount: 420000, paymentMethod: 'Bank Transfer', note: 'အိမ်လခ (Apartment rent)' },
    { daysBack: 10, type: 'expense', catName: 'Food & Dining', amount: 28500, paymentMethod: 'KBZPay', note: 'နေ့လယ်စာနှင့် ကော်ဖီ' },
    { daysBack: 9, type: 'income', catName: 'Sales', amount: 340000, paymentMethod: 'KBZPay', note: 'ဆိုင်ရောင်းရငွေ (Daily shop sales)' },
    { daysBack: 8, type: 'expense', catName: 'Bills & Utilities', amount: 45000, paymentMethod: 'WavePay', note: 'မီတာခနှင့် အင်တာနက်' },
    { daysBack: 6, type: 'expense', catName: 'Transport', amount: 18000, paymentMethod: 'Cash', note: 'Grab & Fuel' },
    { daysBack: 5, type: 'income', catName: 'Freelance', amount: 460000, paymentMethod: 'Bank Transfer', note: 'UI Design Project' },
    { daysBack: 4, type: 'expense', catName: 'Shopping', amount: 95000, paymentMethod: 'KBZPay', note: 'အိမ်သုံးပစ္စည်းများ' },
    { daysBack: 3, type: 'expense', catName: 'Food & Dining', amount: 34000, paymentMethod: 'Cash', note: 'မိသားစု ညစာ' },
    { daysBack: 2, type: 'income', catName: 'Sales', amount: 275000, paymentMethod: 'WavePay', note: 'အွန်လိုင်း အော်ဒါများ' },
    { daysBack: 1, type: 'expense', catName: 'Health', amount: 52000, paymentMethod: 'Card', note: 'ဆေးခန်းနှင့် ဗီတာမင်' },
    { daysBack: 0, type: 'expense', catName: 'Food & Dining', amount: 16500, paymentMethod: 'KBZPay', note: 'မနက်စာ လက်ဖက်ရည်' },
  ];

  return specs
    .map((item): CreateTransactionInput | null => {
      const categoryId = findCatId(item.catName, item.type);
      if (!categoryId) return null;
      return {
        type: item.type,
        amount: item.amount,
        categoryId,
        transactionDate: daysAgo(item.daysBack),
        paymentMethod: item.paymentMethod,
        note: item.note,
      };
    })
    .filter((row): row is CreateTransactionInput => row !== null);
}

export function escapeCsvCell(value: string | number | null | undefined): string {
  const raw = value === null || value === undefined ? '' : String(value);
  const safe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  if (/[",\n\r]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

export function buildTransactionsCsv(rows: Transaction[], currency: CurrencyCode): string {
  const header = [
    'ID',
    'Date',
    'Type',
    'Category',
    'Category (Burmese)',
    'Payment Method',
    'Note',
    'Currency',
    'Amount',
    'Created At',
    'Updated At',
  ].join(',');

  const lines = rows.map((row) =>
    [
      escapeCsvCell(row.id),
      escapeCsvCell(row.transactionDate),
      escapeCsvCell(row.type),
      escapeCsvCell(row.category.name),
      escapeCsvCell(row.category.nameMy ?? ''),
      escapeCsvCell(row.paymentMethod),
      escapeCsvCell(row.note ?? ''),
      escapeCsvCell(currency),
      escapeCsvCell(row.amount.toFixed(2)),
      escapeCsvCell(row.createdAt),
      escapeCsvCell(row.updatedAt),
    ].join(',')
  );

  return `\uFEFF${[header, ...lines].join('\r\n')}`;
}

export interface LedgerBackupFile {
  version: 1;
  exportedAt: string;
  categories: Category[];
  transactions: Transaction[];
}

export function parseAndValidateBackupJson(rawText: string): LedgerBackupFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error('Backup file is not valid JSON.');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Backup file has an invalid structure.');
  }

  const obj = parsed as Record<string, unknown>;
  if (!Array.isArray(obj.categories) || !Array.isArray(obj.transactions)) {
    throw new Error('Backup file must contain "categories" and "transactions" arrays.');
  }

  const validCategories: Category[] = [];
  for (const rawCat of obj.categories) {
    if (!rawCat || typeof rawCat !== 'object') {
      throw new Error('Invalid category entry found in backup.');
    }
    const c = rawCat as Record<string, unknown>;
    if (
      typeof c.id !== 'number' ||
      typeof c.name !== 'string' ||
      (c.type !== 'income' && c.type !== 'expense')
    ) {
      throw new Error('Backup contains malformed category data.');
    }
    validCategories.push({
      id: c.id,
      name: c.name,
      nameMy: typeof c.nameMy === 'string' ? c.nameMy : null,
      type: c.type,
      icon: typeof c.icon === 'string' ? c.icon : 'tag',
      color: typeof c.color === 'string' ? c.color : '#2196F3',
      isDefault: Boolean(c.isDefault),
    });
  }

  const categoriesToUse = validCategories.length > 0 ? validCategories : DEFAULT_CATEGORIES;
  const categoryMap = new Map(categoriesToUse.map((c) => [c.id, c]));

  const validTransactions: Transaction[] = [];
  for (const rawTx of obj.transactions) {
    if (!rawTx || typeof rawTx !== 'object') {
      throw new Error('Invalid transaction entry found in backup.');
    }
    const t = rawTx as Record<string, unknown>;
    const cat = typeof t.categoryId === 'number' ? categoryMap.get(t.categoryId) : undefined;
    if (
      typeof t.id !== 'number' ||
      (t.type !== 'income' && t.type !== 'expense') ||
      typeof t.amount !== 'number' ||
      !Number.isFinite(t.amount) ||
      t.amount <= 0 ||
      typeof t.transactionDate !== 'string' ||
      !DATE_RE.test(t.transactionDate) ||
      !cat ||
      cat.type !== t.type
    ) {
      throw new Error('Backup contains malformed or mismatched transaction data.');
    }

    const nowIso = new Date().toISOString();
    validTransactions.push({
      id: t.id,
      type: t.type,
      amount: Number(t.amount.toFixed(2)),
      categoryId: cat.id,
      transactionDate: t.transactionDate,
      paymentMethod: typeof t.paymentMethod === 'string' && t.paymentMethod.trim() ? t.paymentMethod : 'Cash',
      note: typeof t.note === 'string' ? t.note : null,
      createdAt: typeof t.createdAt === 'string' ? t.createdAt : nowIso,
      updatedAt: typeof t.updatedAt === 'string' ? t.updatedAt : nowIso,
      category: cat,
    });
  }

  return {
    version: 1,
    exportedAt: typeof obj.exportedAt === 'string' ? obj.exportedAt : new Date().toISOString(),
    categories: categoriesToUse,
    transactions: validTransactions,
  };
}
