export interface Account {
  id: string;
  nickname: string;
  bankName: string;
  accountType: 'checking' | 'savings';
  accountNumber: string; // last 4 digits
  currentBalance: number;
  payrollPercentage: number;
  category: 'tithing' | 'savings' | 'bills' | 'expenses' | 'debt';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  accountId: string;
  isRecurring: boolean;
  frequency: 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'annual';
  status: 'current' | 'behind' | 'ahead';
  amountBehind?: number;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  accountId: string;
  isRecurring: boolean;
  billId?: string; // if this expense is a bill payment
  createdAt: string;
  updatedAt: string;
}

export interface Debt {
  id: string;
  name: string;
  currentBalance: number;
  minimumPayment: number;
  interestRate: number;
  accountId: string; // which account makes payments
  dueDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaycheckDistribution {
  id: string;
  paycheckAmount: number;
  date: string;
  distributions: {
    accountId: string;
    amount: number;
    percentage: number;
  }[];
  createdAt: string;
}

export interface StewardshipSettings {
  faithBasedMode: boolean;
  tithingEnabled: boolean;
  tithingPercentage: number;
  emergencyFundPercentage: number;
  paycheckAmount: number;
  payFrequency: 'weekly' | 'bi-weekly' | 'semi-monthly' | 'monthly';
  nextPayDate: string;
  payDates: string[]; // Array of upcoming pay dates
}

export interface SavingsGoal {
  id: string;
  name: string;
  type: 'emergency' | 'house' | 'vacation' | 'wedding' | 'car' | 'education' | 'retirement' | 'custom';
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  monthlyContribution: number;
  accountId?: string; // Optional linked account
  priority: number; // 1-5, 1 being highest
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'paycheck' | 'bill' | 'goal_milestone' | 'debt_payment';
  amount?: number;
  status: 'upcoming' | 'paid' | 'overdue' | 'completed';
  relatedId?: string; // Bill ID, Goal ID, etc.
  category?: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalAllocated: number;
  totalBills: number;
  totalSavings: number;
  totalTithing: number;
  remainingBalance: number;
  allocationPercentage: number;
}

export type AccountCategory = 'tithing' | 'savings' | 'bills' | 'expenses' | 'debt';
export type BillStatus = 'current' | 'behind' | 'ahead';
export type PaymentFrequency = 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'annual';