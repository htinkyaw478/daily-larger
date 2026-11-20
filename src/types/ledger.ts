export type TransactionType = 'income' | 'expense';

export interface Category {
  id: number;
  name: string;
  nameMy: string | null;
  type: TransactionType;
  icon: string;
  color: string;
  isDefault?: boolean;
}

export interface Transaction {
  id: number;
  type: TransactionType;
  amount: number;
  categoryId: number;
  transactionDate: string;
  paymentMethod: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  category: Category;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}

export interface TransactionsResponse {
  data: Transaction[];
  meta: PaginationMeta;
}

export interface CashFlowPoint {
  date: string;
  income: number;
  expense: number;
  net: number;
}

export interface CategoryBreakdownItem {
  categoryId: number;
  name: string;
  nameMy: string | null;
  icon: string;
  color: string;
  total: number;
  percentage: number;
  count: number;
}

export interface DashboardSummary {
  period: {
    from: string;
    to: string;
    previousFrom: string;
    previousTo: string;
  };
  kpis: {
    totalIncome: number;
    totalExpense: number;
    netBalance: number;
    incomeDeltaPct: number | null;
    expenseDeltaPct: number | null;
    netDeltaPct: number | null;
  };
  cashFlow: CashFlowPoint[];
  categoryBreakdown: {
    expense: CategoryBreakdownItem[];
    income: CategoryBreakdownItem[];
  };
  hasAnyTransactions: boolean;
}

export type SortOption = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';

export interface TransactionFilters {
  search?: string;
  type?: TransactionType;
  categoryId?: number;
  from?: string;
  to?: string;
  sort?: SortOption;
  page?: number;
  limit?: number;
}

export interface CreateTransactionInput {
  type: TransactionType;
  amount: number;
  categoryId: number;
  transactionDate: string;
  paymentMethod: string;
  note?: string | null;
}
