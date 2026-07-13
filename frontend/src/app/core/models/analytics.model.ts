import { RecordType, RecordCategory } from './record.model';

export interface DashboardSummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  incomeCount?: number;
  expenseCount?: number;
  transactionCount?: {
    income: number;
    expense: number;
    total: number;
  };
}

export interface CategoryBreakdownItem {
  _id?: RecordCategory;
  category: RecordCategory;
  totalAmount: number;
  count: number;
  type: RecordType;
}

export interface TrendItem {
  period?: string;
  month?: string;
  week?: string;
  type: RecordType;
  totalAmount: number;
  transactionCount: number;
}

export interface RecentActivityItem {
  _id: string;
  amount: number;
  type: RecordType;
  category: RecordCategory;
  date: string;
  description?: string;
  createdAt: string;
}

export interface IncomeExpenseRatio {
  income: number;
  expenses: number;
  ratio: number;        // income / expenses
}
