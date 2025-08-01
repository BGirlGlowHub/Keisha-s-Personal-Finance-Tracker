import { Account, Bill, Expense, Debt, PaycheckDistribution, StewardshipSettings, SavingsGoal } from '@/types'

const STORAGE_KEYS = {
  ACCOUNTS: 'expense-tracker-accounts',
  BILLS: 'expense-tracker-bills',
  EXPENSES: 'expense-tracker-expenses',
  DEBTS: 'expense-tracker-debts',
  PAYCHECK_DISTRIBUTIONS: 'expense-tracker-paycheck-distributions',
  STEWARDSHIP_SETTINGS: 'stewardship-settings',
  SAVINGS_GOALS: 'expense-tracker-savings-goals',
} as const

// Generic storage functions
export const getFromStorage = <T>(key: string): T[] => {
  if (typeof window === 'undefined') return []
  
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error(`Error reading from localStorage key ${key}:`, error)
    return []
  }
}

export const saveToStorage = <T>(key: string, data: T[]): void => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error(`Error saving to localStorage key ${key}:`, error)
  }
}

export const getSettingsFromStorage = (): StewardshipSettings | null => {
  if (typeof window === 'undefined') return null
  
  try {
    const data = localStorage.getItem(STORAGE_KEYS.STEWARDSHIP_SETTINGS)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error('Error reading stewardship settings:', error)
    return null
  }
}

export const saveSettingsToStorage = (settings: StewardshipSettings): void => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(STORAGE_KEYS.STEWARDSHIP_SETTINGS, JSON.stringify(settings))
  } catch (error) {
    console.error('Error saving stewardship settings:', error)
  }
}

// Specific data functions
export const getAccounts = (): Account[] => getFromStorage<Account>(STORAGE_KEYS.ACCOUNTS)
export const saveAccounts = (accounts: Account[]): void => saveToStorage(STORAGE_KEYS.ACCOUNTS, accounts)

export const getBills = (): Bill[] => getFromStorage<Bill>(STORAGE_KEYS.BILLS)
export const saveBills = (bills: Bill[]): void => saveToStorage(STORAGE_KEYS.BILLS, bills)

export const getExpenses = (): Expense[] => getFromStorage<Expense>(STORAGE_KEYS.EXPENSES)
export const saveExpenses = (expenses: Expense[]): void => saveToStorage(STORAGE_KEYS.EXPENSES, expenses)

export const getDebts = (): Debt[] => getFromStorage<Debt>(STORAGE_KEYS.DEBTS)
export const saveDebts = (debts: Debt[]): void => saveToStorage(STORAGE_KEYS.DEBTS, debts)

export const getPaycheckDistributions = (): PaycheckDistribution[] => 
  getFromStorage<PaycheckDistribution>(STORAGE_KEYS.PAYCHECK_DISTRIBUTIONS)
export const savePaycheckDistributions = (distributions: PaycheckDistribution[]): void => 
  saveToStorage(STORAGE_KEYS.PAYCHECK_DISTRIBUTIONS, distributions)

// Savings Goals storage
export const getSavingsGoals = (): SavingsGoal[] => 
  getFromStorage<SavingsGoal>(STORAGE_KEYS.SAVINGS_GOALS)
export const saveSavingsGoals = (goals: SavingsGoal[]): void => 
  saveToStorage(STORAGE_KEYS.SAVINGS_GOALS, goals)

// Clear all data (for reset functionality)
export const clearAllData = (): void => {
  if (typeof window === 'undefined') return
  
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key)
  })
}