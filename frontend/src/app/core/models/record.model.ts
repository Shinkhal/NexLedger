export enum RecordType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum RecordCategory {
  // Income
  SALARY = 'SALARY',
  FREELANCE = 'FREELANCE',
  INVESTMENT = 'INVESTMENT',
  BUSINESS = 'BUSINESS',
  GIFT = 'GIFT',
  OTHER_INCOME = 'OTHER_INCOME',
  // Expense
  HOUSING = 'HOUSING',
  UTILITIES = 'UTILITIES',
  GROCERIES = 'GROCERIES',
  TRANSPORTATION = 'TRANSPORTATION',
  HEALTHCARE = 'HEALTHCARE',
  ENTERTAINMENT = 'ENTERTAINMENT',
  EDUCATION = 'EDUCATION',
  SHOPPING = 'SHOPPING',
  DINING = 'DINING',
  TRAVEL = 'TRAVEL',
  INSURANCE = 'INSURANCE',
  DEBT_PAYMENT = 'DEBT_PAYMENT',
  SAVINGS = 'SAVINGS',
  OTHER_EXPENSE = 'OTHER_EXPENSE',
}

export interface FinancialRecord {
  _id: string;
  userId: string;
  amount: number;
  type: RecordType;
  category: RecordCategory;
  date: string;           // ISO 8601
  description?: string;
  tags: string[];
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecordRequest {
  amount: number;          // > 0
  type: RecordType;
  category: RecordCategory;
  date: string;            // ISO 8601
  description?: string;
  tags?: string[];
}

export interface UpdateRecordRequest {
  amount?: number;
  type?: RecordType;
  category?: RecordCategory;
  date?: string;
  description?: string;
  tags?: string[];
}

export interface RecordFilterParams {
  type?: RecordType;
  category?: RecordCategory;
  startDate?: string;
  endDate?: string;
  search?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
}
