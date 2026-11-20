import Papa from 'papaparse';
import type { Category, Transaction, TransactionType } from '../types/ledger';

export type DuplicateStrategy = 'skip' | 'update' | 'import_as_new';
export type DuplicateReason = 'same_id' | 'same_content' | 'duplicate_in_file';

export interface ParsedCsvTransaction {
  id: number | null;
  transactionDate: string;
  type: TransactionType;
  categoryName: string;
  categoryNameMy: string | null;
  matchedCategoryId: number | null;
  paymentMethod: string;
  note: string | null;
  amount: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CsvPreviewRow {
  rowNumber: number;
  status: 'new' | 'duplicate' | 'invalid';
  duplicateReason?: DuplicateReason;
  matchedExistingId?: number;
  errors: string[];
  parsed?: ParsedCsvTransaction;
  rawSummary: {
    date: string;
    type: string;
    category: string;
    amount: string;
    note: string;
  };
}

export interface CsvImportPreview {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  newRows: number;
  headerError: string | null;
  rows: CsvPreviewRow[];
}

export interface CsvImportResult {
  insertedCount: number;
  updatedCount: number;
  skippedCount: number;
  invalidCount: number;
  createdCategoriesCount: number;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidCalendarDate(dateStr: string): boolean {
  if (!DATE_RE.test(dateStr)) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

function normalizeHeaderName(header: string): string {
  return header.replace(/^\uFEFF/, '').trim().toLowerCase();
}

function parseTransactionType(raw: string): TransactionType | null {
  const val = raw.trim().toLowerCase();
  if (val === 'income' || val === 'ဝင်ငွေ') return 'income';
  if (val === 'expense' || val === 'ထွက်ငွေ') return 'expense';
  return null;
}

function unescapeFormulaPrefix(val: string): string {
  return /^'[=+\-@\t\r]/.test(val) ? val.slice(1) : val;
}

function parsePositiveAmount(raw: string): number | null {
  const cleaned = raw.replace(/,/g, '').trim();
  if (!cleaned) return null;
  const num = Number(cleaned);
  if (!Number.isFinite(num) || num <= 0 || num > 999999999999.99) {
    return null;
  }
  return Number(num.toFixed(2));
}

function parseOptionalPositiveInt(raw: string): { valid: boolean; value: number | null } {
  const trimmed = raw.trim();
  if (!trimmed) return { valid: true, value: null };
  if (!/^\d+$/.test(trimmed)) return { valid: false, value: null };
  const num = Number(trimmed);
  if (!Number.isSafeInteger(num) || num <= 0) {
    return { valid: false, value: null };
  }
  return { valid: true, value: num };
}

function parseOptionalIsoTimestamp(raw: string): { valid: boolean; value: string | null } {
  const trimmed = raw.trim();
  if (!trimmed) return { valid: true, value: null };
  const ms = Date.parse(trimmed);
  if (Number.isNaN(ms)) return { valid: false, value: null };
  return { valid: true, value: new Date(ms).toISOString() };
}

function buildContentFingerprint(params: {
  transactionDate: string;
  type: TransactionType;
  categoryName: string;
  amount: number;
  paymentMethod: string;
  note: string | null;
}): string {
  return [
    params.transactionDate,
    params.type,
    params.categoryName.trim().toLowerCase(),
    params.amount.toFixed(2),
    params.paymentMethod.trim().toLowerCase(),
    (params.note ?? '').trim(),
  ].join('|');
}

function getField(record: Record<string, string>, keys: string[]): string {
  for (const key of keys) {
    if (key in record && record[key] !== undefined) {
      return String(record[key]);
    }
  }
  return '';
}

export function parseAndBuildCsvImportPreview(
  rawCsvText: string,
  existingCategories: Category[],
  existingTransactions: Transaction[]
): CsvImportPreview {
  const cleanedCsv = rawCsvText
    .replace(/^\uFEFF/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
  if (!cleanedCsv.trim()) {
    return {
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      duplicateRows: 0,
      newRows: 0,
      headerError: 'CSV file is empty.',
      rows: [],
    };
  }

  const parsed = Papa.parse<Record<string, string>>(cleanedCsv, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: normalizeHeaderName,
  });

  const headers = parsed.meta.fields ?? [];
  const requiredHeaders = ['date', 'type', 'category', 'amount'];
  const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));

  if (missingHeaders.length > 0) {
    return {
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      duplicateRows: 0,
      newRows: 0,
      headerError: `Missing required CSV columns: ${missingHeaders.join(', ')}. Expected format: ID, Date, Type, Category, Category (Burmese), Payment Method, Note, Currency, Amount`,
      rows: [],
    };
  }

  if (parsed.data.length === 0) {
    return {
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      duplicateRows: 0,
      newRows: 0,
      headerError: 'CSV contains headers only and has no transaction rows to import.',
      rows: [],
    };
  }

  // Index PapaParse structural errors by data row index
  const parserErrorsByRow = new Map<number, string[]>();
  for (const err of parsed.errors) {
    if (typeof err.row === 'number') {
      const list = parserErrorsByRow.get(err.row) ?? [];
      list.push(err.message);
      parserErrorsByRow.set(err.row, list);
    }
  }

  const existingById = new Map(existingTransactions.map((tx) => [tx.id, tx]));
  const existingByFingerprint = new Map<string, Transaction>();
  for (const tx of existingTransactions) {
    const fp = buildContentFingerprint({
      transactionDate: tx.transactionDate,
      type: tx.type,
      categoryName: tx.category.name,
      amount: tx.amount,
      paymentMethod: tx.paymentMethod,
      note: tx.note,
    });
    if (!existingByFingerprint.has(fp)) {
      existingByFingerprint.set(fp, tx);
    }
  }

  const seenIdsInCsv = new Set<number>();
  const seenFingerprintsInCsv = new Set<string>();
  const rows: CsvPreviewRow[] = [];

  for (let i = 0; i < parsed.data.length; i++) {
    const rowNumber = i + 2; // Row 1 is CSV header
    const record = parsed.data[i] ?? {};
    const errors: string[] = [];

    const parserErrs = parserErrorsByRow.get(i);
    if (parserErrs?.length) {
      errors.push(...parserErrs.map((msg) => `CSV syntax error: ${msg}`));
    }

    const rawId = getField(record, ['id']);
    const rawDate = getField(record, ['date', 'transaction_date', 'transactiondate']).trim();
    const rawType = getField(record, ['type']);
    const rawCategory = unescapeFormulaPrefix(getField(record, ['category'])).trim();
    const rawCategoryMy = unescapeFormulaPrefix(
      getField(record, ['category (burmese)', 'category_my', 'categorymy'])
    ).trim();
    const rawPayment = unescapeFormulaPrefix(
      getField(record, ['payment method', 'payment_method', 'paymentmethod'])
    ).trim();
    const rawNote = unescapeFormulaPrefix(getField(record, ['note', 'memo', 'description']));
    const rawAmount = getField(record, ['amount']).trim();
    const rawCreatedAt = getField(record, ['created at', 'created_at', 'createdat']);
    const rawUpdatedAt = getField(record, ['updated at', 'updated_at', 'updatedat']);

    const idCheck = parseOptionalPositiveInt(rawId);
    if (!idCheck.valid) {
      errors.push(`Invalid ID "${rawId}" (must be a positive integer).`);
    }

    if (!rawDate) {
      errors.push('Missing Date.');
    } else if (!isValidCalendarDate(rawDate)) {
      errors.push(`Invalid Date "${rawDate}" (expected YYYY-MM-DD).`);
    }

    const parsedType = parseTransactionType(rawType);
    if (!rawType.trim()) {
      errors.push('Missing Type.');
    } else if (!parsedType) {
      errors.push(`Invalid Type "${rawType}" (must be income or expense).`);
    }

    if (!rawCategory) {
      errors.push('Missing Category.');
    }

    const parsedAmount = parsePositiveAmount(rawAmount);
    if (!rawAmount) {
      errors.push('Missing Amount.');
    } else if (parsedAmount === null) {
      errors.push(`Invalid Amount "${rawAmount}" (must be a number > 0).`);
    }

    const createdCheck = parseOptionalIsoTimestamp(rawCreatedAt);
    if (!createdCheck.valid) {
      errors.push(`Invalid Created At timestamp "${rawCreatedAt}".`);
    }

    const updatedCheck = parseOptionalIsoTimestamp(rawUpdatedAt);
    if (!updatedCheck.valid) {
      errors.push(`Invalid Updated At timestamp "${rawUpdatedAt}".`);
    }

    const rawSummary = {
      date: rawDate || '—',
      type: rawType.trim() || '—',
      category: rawCategory || '—',
      amount: rawAmount || '—',
      note: rawNote.trim() || '—',
    };

    if (errors.length > 0 || !parsedType || parsedAmount === null) {
      rows.push({
        rowNumber,
        status: 'invalid',
        errors,
        rawSummary,
      });
      continue;
    }

    const matchedCategory = existingCategories.find(
      (c) =>
        c.type === parsedType &&
        (c.name.toLowerCase() === rawCategory.toLowerCase() ||
          (rawCategoryMy && c.nameMy && c.nameMy.trim() === rawCategoryMy))
    );

    const paymentMethod = (rawPayment || 'Cash').slice(0, 50);
    const note = rawNote.trim() ? rawNote.trim().slice(0, 255) : null;

    const parsedTx: ParsedCsvTransaction = {
      id: idCheck.value,
      transactionDate: rawDate,
      type: parsedType,
      categoryName: rawCategory.slice(0, 100),
      categoryNameMy: rawCategoryMy ? rawCategoryMy.slice(0, 100) : null,
      matchedCategoryId: matchedCategory?.id ?? null,
      paymentMethod,
      note,
      amount: parsedAmount,
      createdAt: createdCheck.value,
      updatedAt: updatedCheck.value,
    };

    const fingerprint = buildContentFingerprint({
      transactionDate: parsedTx.transactionDate,
      type: parsedTx.type,
      categoryName: matchedCategory?.name ?? parsedTx.categoryName,
      amount: parsedTx.amount,
      paymentMethod: parsedTx.paymentMethod,
      note: parsedTx.note,
    });

    let duplicateReason: DuplicateReason | undefined;
    let matchedExistingId: number | undefined;

    if (parsedTx.id !== null && existingById.has(parsedTx.id)) {
      duplicateReason = 'same_id';
      matchedExistingId = parsedTx.id;
    } else if (parsedTx.id !== null && seenIdsInCsv.has(parsedTx.id)) {
      duplicateReason = 'duplicate_in_file';
    } else if (existingByFingerprint.has(fingerprint)) {
      duplicateReason = 'same_content';
      matchedExistingId = existingByFingerprint.get(fingerprint)?.id;
    } else if (seenFingerprintsInCsv.has(fingerprint)) {
      duplicateReason = 'duplicate_in_file';
    }

    if (parsedTx.id !== null) seenIdsInCsv.add(parsedTx.id);
    seenFingerprintsInCsv.add(fingerprint);

    rows.push({
      rowNumber,
      status: duplicateReason ? 'duplicate' : 'new',
      duplicateReason,
      matchedExistingId,
      errors: [],
      parsed: parsedTx,
      rawSummary,
    });
  }

  const invalidRows = rows.filter((r) => r.status === 'invalid').length;
  const duplicateRows = rows.filter((r) => r.status === 'duplicate').length;
  const newRows = rows.filter((r) => r.status === 'new').length;
  const validRows = newRows + duplicateRows;

  return {
    totalRows: rows.length,
    validRows,
    invalidRows,
    duplicateRows,
    newRows,
    headerError: null,
    rows,
  };
}
