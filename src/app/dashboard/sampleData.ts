import { Account, Bill, Debt, StewardshipSettings, SavingsGoal } from '@/types'
import { 
  saveAccounts, 
  saveBills, 
  saveDebts, 
  saveSettingsToStorage,
  saveSavingsGoals
} from './storage'

export const loadSampleData = () => {
  // Sample Settings - Faith-based approach
  const sampleSettings: StewardshipSettings = {
    faithBasedMode: true,
    tithingEnabled: true,
    tithingPercentage: 10,
    emergencyFundPercentage: 5,
    paycheckAmount: 1500, // Bi-weekly paycheck (updated to match your example)
    payFrequency: 'bi-weekly',
    nextPayDate: '2024-08-15',
    payDates: ['2024-08-01', '2024-08-15', '2024-08-29'] // 3 paychecks in August
  }

  // Sample Accounts - 10 realistic accounts with proper percentage distribution
  const sampleAccounts: Account[] = [
    {
      id: 'account_tithing_001',
      nickname: 'Tithing & Giving',
      bankName: 'First Bank',
      accountType: 'checking',
      accountNumber: '1234',
      currentBalance: 800,
      payrollPercentage: 10,
      category: 'tithing',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'account_emergency_001',
      nickname: 'Emergency Fund',
      bankName: 'Ally Bank',
      accountType: 'savings',
      accountNumber: '5678',
      currentBalance: 2500,
      payrollPercentage: 5,
      category: 'savings',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'account_bills_001',
      nickname: 'Bills Account',
      bankName: 'Chase Bank',
      accountType: 'checking',
      accountNumber: '9012',
      currentBalance: 1200,
      payrollPercentage: 35,
      category: 'bills',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'account_house_001',
      nickname: 'House Fund',
      bankName: 'Capital One',
      accountType: 'savings',
      accountNumber: '3456',
      currentBalance: 5000,
      payrollPercentage: 8,
      category: 'savings',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'account_groceries_001',
      nickname: 'Groceries & Gas',
      bankName: 'USAA',
      accountType: 'checking',
      accountNumber: '7890',
      currentBalance: 600,
      payrollPercentage: 15,
      category: 'expenses',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'account_vacation_001',
      nickname: 'Vacation Fund',
      bankName: 'Discover Bank',
      accountType: 'savings',
      accountNumber: '2468',
      currentBalance: 1200,
      payrollPercentage: 5,
      category: 'savings',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'account_car_001',
      nickname: 'Car Maintenance',
      bankName: 'Wells Fargo',
      accountType: 'savings',
      accountNumber: '1357',
      currentBalance: 800,
      payrollPercentage: 3,
      category: 'expenses',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'account_clothes_001',
      nickname: 'Clothing Fund',
      bankName: 'Bank of America',
      accountType: 'savings',
      accountNumber: '9753',
      currentBalance: 300,
      payrollPercentage: 3,
      category: 'expenses',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'account_kids_001',
      nickname: 'Kids Activities',
      bankName: 'PNC Bank',
      accountType: 'checking',
      accountNumber: '8642',
      currentBalance: 450,
      payrollPercentage: 8,
      category: 'expenses',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'account_misc_001',
      nickname: 'Miscellaneous',
      bankName: 'Navy Federal',
      accountType: 'checking',
      accountNumber: '4826',
      currentBalance: 200,
      payrollPercentage: 8,
      category: 'expenses',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]

  // Sample Bills
  const sampleBills: Bill[] = [
    {
      id: 'bill_rent_001',
      name: 'Rent',
      amount: 1200,
      dueDate: '2024-08-01',
      accountId: 'account_bills_001',
      isRecurring: true,
      frequency: 'monthly',
      status: 'current',
      category: 'Housing',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'bill_electric_001',
      name: 'Electric Bill',
      amount: 120,
      dueDate: '2024-08-15',
      accountId: 'account_bills_001',
      isRecurring: true,
      frequency: 'monthly',
      status: 'current',
      category: 'Utilities',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'bill_water_001',
      name: 'Water Bill',
      amount: 45,
      dueDate: '2024-08-10',
      accountId: 'account_bills_001',
      isRecurring: true,
      frequency: 'monthly',
      status: 'current',
      category: 'Utilities',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'bill_internet_001',
      name: 'Internet',
      amount: 60,
      dueDate: '2024-08-20',
      accountId: 'account_bills_001',
      isRecurring: true,
      frequency: 'monthly',
      status: 'current',
      category: 'Utilities',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'bill_phone_001',
      name: 'Phone',
      amount: 80,
      dueDate: '2024-08-25',
      accountId: 'account_bills_001',
      isRecurring: true,
      frequency: 'monthly',
      status: 'current',
      category: 'Utilities',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'bill_car_001',
      name: 'Car Payment',
      amount: 350,
      dueDate: '2024-08-05',
      accountId: 'account_bills_001',
      isRecurring: true,
      frequency: 'monthly',
      status: 'current',
      category: 'Transportation',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'bill_insurance_001',
      name: 'Car Insurance',
      amount: 125,
      dueDate: '2024-08-12',
      accountId: 'account_bills_001',
      isRecurring: true,
      frequency: 'monthly',
      status: 'current',
      category: 'Insurance',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'bill_groceries_001',
      name: 'Groceries',
      amount: 400,
      dueDate: '2024-08-01',
      accountId: 'account_groceries_001',
      isRecurring: true,
      frequency: 'monthly',
      status: 'current',
      category: 'Living',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'bill_gas_001',
      name: 'Gas/Fuel',
      amount: 200,
      dueDate: '2024-08-01',
      accountId: 'account_groceries_001',
      isRecurring: true,
      frequency: 'monthly',
      status: 'current',
      category: 'Transportation',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]

  // Sample Debts
  const sampleDebts: Debt[] = [
    {
      id: 'debt_credit_001',
      name: 'Credit Card',
      currentBalance: 3500,
      minimumPayment: 105,
      interestRate: 18.99,
      accountId: 'account_bills_001',
      dueDate: '2024-08-15',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'debt_student_001',
      name: 'Student Loan',
      currentBalance: 15000,
      minimumPayment: 150,
      interestRate: 4.5,
      accountId: 'account_bills_001',
      dueDate: '2024-08-01',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]

  // Sample Goals
  const sampleGoals: SavingsGoal[] = [
    {
      id: 'goal_emergency_001',
      name: 'Emergency Fund',
      type: 'emergency',
      targetAmount: 10000,
      currentAmount: 2500,
      targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
      monthlyContribution: 500,
      accountId: 'account_emergency_001',
      priority: 1,
      isActive: true,
      description: 'Build 6 months of expenses for financial security',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'goal_house_001',
      name: 'House Down Payment',
      type: 'house',
      targetAmount: 50000,
      currentAmount: 5000,
      targetDate: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 years from now
      monthlyContribution: 1500,
      accountId: 'account_house_001',
      priority: 2,
      isActive: true,
      description: '20% down payment for our dream home',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'goal_vacation_001',
      name: 'European Vacation',
      type: 'vacation',
      targetAmount: 8000,
      currentAmount: 1200,
      targetDate: new Date(Date.now() + 400 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // ~13 months from now
      monthlyContribution: 500,
      accountId: 'account_vacation_001',
      priority: 3,
      isActive: true,
      description: 'Two-week European adventure for the family',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'goal_car_001',
      name: 'New Car Fund',
      type: 'car',
      targetAmount: 25000,
      currentAmount: 800,
      targetDate: new Date(Date.now() + 1095 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 years from now
      monthlyContribution: 600,
      accountId: 'account_car_001',
      priority: 4,
      isActive: true,
      description: 'Replace current vehicle with reliable family car',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]

  // Save all sample data
  saveSettingsToStorage(sampleSettings)
  saveAccounts(sampleAccounts)
  saveBills(sampleBills)
  saveDebts(sampleDebts)
  saveSavingsGoals(sampleGoals)

  return {
    settings: sampleSettings,
    accounts: sampleAccounts,
    bills: sampleBills,
    debts: sampleDebts,
    goals: sampleGoals
  }
}

export const clearAllSampleData = () => {
  saveSettingsToStorage({
    faithBasedMode: true,
    tithingEnabled: true,
    tithingPercentage: 10,
    emergencyFundPercentage: 5,
    paycheckAmount: 0,
    payFrequency: 'bi-weekly',
    nextPayDate: '',
    payDates: []
  })
  saveAccounts([])
  saveBills([])
  saveDebts([])
  saveSavingsGoals([])
}