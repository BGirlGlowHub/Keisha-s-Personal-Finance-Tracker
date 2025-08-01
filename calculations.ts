import { Account, Bill, StewardshipSettings, FinancialSummary } from '@/types'

export const calculateBillPercentage = (billAmount: number, paycheckAmount: number): number => {
  if (paycheckAmount <= 0) return 0
  return (billAmount / paycheckAmount) * 100
}

export const calculateTotalBillsAmount = (bills: Bill[]): number => {
  return bills
    .filter(bill => bill.isActive)
    .reduce((total, bill) => total + bill.amount, 0)
}

export const calculateTotalAccountPercentages = (accounts: Account[]): number => {
  return accounts
    .filter(account => account.isActive)
    .reduce((total, account) => total + account.payrollPercentage, 0)
}

// Helper function to calculate monthly income from paycheck frequency
export const calculateMonthlyIncome = (paycheckAmount: number, frequency: string): number => {
  switch (frequency) {
    case 'weekly':
      return paycheckAmount * 52 / 12 // 52 weeks per year / 12 months
    case 'bi-weekly':
      return paycheckAmount * 26 / 12 // 26 pay periods per year / 12 months
    case 'semi-monthly':
      return paycheckAmount * 2 // 2 paychecks per month
    case 'monthly':
      return paycheckAmount // 1 paycheck per month
    default:
      return paycheckAmount * 26 / 12 // Default to bi-weekly
  }
}

// Calculate income for specific month based on actual paycheck dates
export const calculateCurrentMonthIncome = (
  paycheckAmount: number, 
  frequency: string, 
  payDates: string[]
): number => {
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  // Count paychecks in current month
  const paychecksThisMonth = payDates.filter(dateStr => {
    const payDate = new Date(dateStr + 'T00:00:00')
    return payDate.getMonth() === currentMonth && payDate.getFullYear() === currentYear
  }).length
  
  // If no payDates provided, fall back to average calculation
  if (payDates.length === 0) {
    return calculateMonthlyIncome(paycheckAmount, frequency)
  }
  
  return paycheckAmount * paychecksThisMonth
}

export const calculateFinancialSummary = (
  accounts: Account[],
  bills: Bill[],
  settings: StewardshipSettings
): FinancialSummary => {
  const activeAccounts = accounts.filter(account => account.isActive)
  const activeBills = bills.filter(bill => bill.isActive)
  
  const monthlyIncome = calculateCurrentMonthIncome(settings.paycheckAmount, settings.payFrequency, settings.payDates || [])
  const totalBills = calculateTotalBillsAmount(activeBills)
  const totalAllocated = calculateTotalAccountPercentages(activeAccounts)
  
  const tithingAccounts = activeAccounts.filter(account => account.category === 'tithing')
  const savingsAccounts = activeAccounts.filter(account => account.category === 'savings')
  
  const totalTithing = tithingAccounts.reduce((sum, account) => 
    sum + ((monthlyIncome * account.payrollPercentage) / 100), 0)
  
  const totalSavings = savingsAccounts.reduce((sum, account) => 
    sum + ((monthlyIncome * account.payrollPercentage) / 100), 0)
  
  const remainingBalance = monthlyIncome - (monthlyIncome * totalAllocated / 100)
  
  return {
    totalIncome: monthlyIncome,
    totalAllocated: (monthlyIncome * totalAllocated) / 100,
    totalBills,
    totalSavings,
    totalTithing,
    remainingBalance,
    allocationPercentage: totalAllocated
  }
}

export const calculateOptimalPercentages = (
  bills: Bill[],
  settings: StewardshipSettings
): { accountId: string; percentage: number }[] => {
  const { paycheckAmount, tithingEnabled, tithingPercentage, emergencyFundPercentage } = settings
  
  let remainingPercentage = 100
  const allocations: { accountId: string; percentage: number }[] = []
  
  // First priority: Tithing (if enabled)
  if (tithingEnabled) {
    allocations.push({ accountId: 'tithing', percentage: tithingPercentage })
    remainingPercentage -= tithingPercentage
  }
  
  // Second priority: Emergency fund/savings
  allocations.push({ accountId: 'emergency', percentage: emergencyFundPercentage })
  remainingPercentage -= emergencyFundPercentage
  
  // Third priority: Bills (distributed based on amount)
  const activeBills = bills.filter(bill => bill.isActive)
  const totalBillsAmount = calculateTotalBillsAmount(activeBills)
  
  activeBills.forEach(bill => {
    const billPercentage = calculateBillPercentage(bill.amount, paycheckAmount)
    allocations.push({ accountId: bill.accountId, percentage: billPercentage })
    remainingPercentage -= billPercentage
  })
  
  return allocations
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

export const formatPercentage = (percentage: number): string => {
  return `${percentage.toFixed(2)}%`
}

export const validateBudgetBalance = (
  accounts: Account[],
  settings: StewardshipSettings
): { isValid: boolean; totalPercentage: number; message: string } => {
  const totalPercentage = calculateTotalAccountPercentages(accounts)
  
  if (totalPercentage > 100) {
    return {
      isValid: false,
      totalPercentage,
      message: `Budget exceeds 100% by ${formatPercentage(totalPercentage - 100)}. Please reduce allocations.`
    }
  }
  
  if (totalPercentage > 95) {
    return {
      isValid: true,
      totalPercentage,
      message: `Budget uses ${formatPercentage(totalPercentage)} of income. Consider leaving more buffer.`
    }
  }
  
  return {
    isValid: true,
    totalPercentage,
    message: `Budget looks good! Using ${formatPercentage(totalPercentage)} with ${formatPercentage(100 - totalPercentage)} remaining.`
  }
}

export const generateAccountId = (): string => {
  return `account_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export const generateBillId = (): string => {
  return `bill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export const generateExpenseId = (): string => {
  return `expense_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Debt payoff strategy calculations
export interface DebtPayoffStrategy {
  strategyName: string
  totalInterest: number
  payoffTime: number // in months
  monthlyPayments: { debtId: string; payment: number }[]
  timeline: { month: number; debtId: string; remainingBalance: number }[]
}

export const calculateDebtSnowball = (debts: any[], extraPayment: number = 0): DebtPayoffStrategy => {
  // Sort by balance (smallest first)
  const sortedDebts = [...debts].sort((a, b) => a.currentBalance - b.currentBalance)
  return calculateDebtPayoffStrategy(sortedDebts, extraPayment, 'Debt Snowball')
}

export const calculateDebtAvalanche = (debts: any[], extraPayment: number = 0): DebtPayoffStrategy => {
  // Sort by interest rate (highest first)
  const sortedDebts = [...debts].sort((a, b) => b.interestRate - a.interestRate)
  return calculateDebtPayoffStrategy(sortedDebts, extraPayment, 'Debt Avalanche')
}

export const calculateDebtPayoffStrategy = (
  sortedDebts: any[], 
  extraPayment: number, 
  strategyName: string
): DebtPayoffStrategy => {
  const workingDebts = sortedDebts.map(debt => ({
    ...debt,
    remainingBalance: debt.currentBalance
  }))
  
  const timeline: { month: number; debtId: string; remainingBalance: number }[] = []
  const monthlyPayments: { debtId: string; payment: number }[] = []
  let totalInterest = 0
  let month = 0
  let availableExtraPayment = extraPayment
  
  // Initialize minimum payments
  workingDebts.forEach(debt => {
    monthlyPayments.push({ debtId: debt.id, payment: debt.minimumPayment })
  })
  
  while (workingDebts.some(debt => debt.remainingBalance > 0)) {
    month++
    let freedUpPayment = 0
    
    workingDebts.forEach((debt, index) => {
      if (debt.remainingBalance <= 0) return
      
      // Calculate interest for this month
      const monthlyInterest = (debt.remainingBalance * debt.interestRate / 100) / 12
      totalInterest += monthlyInterest
      
      // Determine payment amount
      let payment = debt.minimumPayment
      
      // Add extra payment to first unpaid debt (following strategy order)
      if (index === workingDebts.findIndex(d => d.remainingBalance > 0)) {
        payment += availableExtraPayment + freedUpPayment
      }
      
      // Don't pay more than remaining balance
      payment = Math.min(payment, debt.remainingBalance + monthlyInterest)
      
      // Apply payment
      debt.remainingBalance = Math.max(0, debt.remainingBalance + monthlyInterest - payment)
      
      // Track payment for this debt
      const existingPayment = monthlyPayments.find(p => p.debtId === debt.id)
      if (existingPayment && month === 1) {
        existingPayment.payment = payment
      }
      
      // If debt is paid off, free up its minimum payment
      if (debt.remainingBalance <= 0) {
        freedUpPayment += debt.minimumPayment
      }
      
      timeline.push({
        month,
        debtId: debt.id,
        remainingBalance: debt.remainingBalance
      })
    })
  }
  
  return {
    strategyName,
    totalInterest,
    payoffTime: month,
    monthlyPayments,
    timeline
  }
}

// Helper functions for debt calculations
export const calculatePayoffTime = (balance: number, monthlyPayment: number, interestRate: number): number => {
  if (monthlyPayment <= 0 || balance <= 0) return 0
  
  const monthlyInterestRate = interestRate / 100 / 12
  if (monthlyInterestRate <= 0) {
    return Math.ceil(balance / monthlyPayment)
  }
  
  const months = -Math.log(1 - (balance * monthlyInterestRate) / monthlyPayment) / Math.log(1 + monthlyInterestRate)
  return Math.ceil(months)
}

export const calculateTotalInterest = (balance: number, monthlyPayment: number, interestRate: number): number => {
  const months = calculatePayoffTime(balance, monthlyPayment, interestRate)
  return Math.max(0, (months * monthlyPayment) - balance)
}

export const calculateExtraPaymentImpact = (
  debt: any,
  extraPayment: number
): { savedInterest: number; savedTime: number; newPayoffTime: number } => {
  const originalPayoff = calculatePayoffTime(debt.currentBalance, debt.minimumPayment, debt.interestRate)
  const originalInterest = calculateTotalInterest(debt.currentBalance, debt.minimumPayment, debt.interestRate)
  
  const newPayoff = calculatePayoffTime(debt.currentBalance, debt.minimumPayment + extraPayment, debt.interestRate)
  const newInterest = calculateTotalInterest(debt.currentBalance, debt.minimumPayment + extraPayment, debt.interestRate)
  
  return {
    savedInterest: originalInterest - newInterest,
    savedTime: originalPayoff - newPayoff,
    newPayoffTime: newPayoff
  }
}

// Account balance calculations
export interface AccountBalanceInfo {
  accountId: string
  accountName: string
  startingBalance: number
  monthlyInflow: number
  monthlyOutflow: number
  endingBalance: number
  billsCount: number
  utilization: number // percentage of monthly inflow used
}

export const calculateAccountBalances = (
  accounts: any[],
  bills: any[],
  settings: any
): AccountBalanceInfo[] => {
  const monthlyIncome = calculateMonthlyIncome(settings.paycheckAmount, settings.payFrequency)
  
  return accounts.map(account => {
    const accountBills = bills.filter(bill => bill.accountId === account.id && bill.isActive)
    const monthlyInflow = (monthlyIncome * account.payrollPercentage) / 100
    const monthlyOutflow = accountBills.reduce((sum, bill) => {
      // Convert bill frequency to monthly amount
      let monthlyAmount = bill.amount
      switch (bill.frequency) {
        case 'weekly':
          monthlyAmount = bill.amount * 52 / 12
          break
        case 'bi-weekly':
          monthlyAmount = bill.amount * 26 / 12
          break
        case 'quarterly':
          monthlyAmount = bill.amount / 3
          break
        case 'annual':
          monthlyAmount = bill.amount / 12
          break
        case 'monthly':
        default:
          monthlyAmount = bill.amount
      }
      return sum + monthlyAmount
    }, 0)
    
    const endingBalance = account.currentBalance + monthlyInflow - monthlyOutflow
    const utilization = monthlyInflow > 0 ? (monthlyOutflow / monthlyInflow) * 100 : 0
    
    return {
      accountId: account.id,
      accountName: account.nickname,
      startingBalance: account.currentBalance,
      monthlyInflow,
      monthlyOutflow,
      endingBalance,
      billsCount: accountBills.length,
      utilization
    }
  })
}

export const getBudgetRecommendations = (
  accounts: any[],
  totalAllocated: number
): { type: 'error' | 'warning' | 'suggestion'; message: string; action?: string }[] => {
  const recommendations = []
  
  if (totalAllocated > 100) {
    recommendations.push({
      type: 'error' as const,
      message: `Your budget exceeds 100% by ${formatPercentage(totalAllocated - 100)}. You need to reduce allocations.`,
      action: 'Reduce account percentages or increase income'
    })
  }
  
  if (totalAllocated > 95 && totalAllocated <= 100) {
    recommendations.push({
      type: 'warning' as const,
      message: `Budget uses ${formatPercentage(totalAllocated)} of income. Consider leaving more buffer.`,
      action: 'Reduce some account percentages to leave 5-10% buffer'
    })
  }
  
  if (totalAllocated < 80) {
    recommendations.push({
      type: 'suggestion' as const,
      message: `You have ${formatPercentage(100 - totalAllocated)} unallocated income.`,
      action: 'Consider increasing savings, emergency fund, or debt payments'
    })
  }
  
  // Check for accounts with very high utilization
  const accountBalances = calculateAccountBalances(accounts, [], { paycheckAmount: 1000, payFrequency: 'bi-weekly' })
  accountBalances.forEach(balance => {
    if (balance.utilization > 90) {
      recommendations.push({
        type: 'warning' as const,
        message: `${balance.accountName} account is over 90% utilized.`,
        action: 'Consider increasing allocation or reducing bills in this account'
      })
    }
  })
  
  return recommendations
}

// Debt reduction suggestions based on expense categories
export interface DebtReductionSuggestion {
  category: string
  type: 'negotiable' | 'non-negotiable' | 'lifestyle'
  totalAmount: number
  bills: string[]
  suggestions: string[]
  potentialSavings: number
  priority: number
}

export const getDebtReductionSuggestions = (
  bills: any[],
  accounts: any[],
  settings: any
): DebtReductionSuggestion[] => {
  const suggestions: DebtReductionSuggestion[] = []
  const monthlyIncome = calculateMonthlyIncome(settings.paycheckAmount, settings.payFrequency)
  
  // Categorize bills by negotiability
  const billCategories = {
    'non-negotiable': {
      categories: ['Housing', 'Utilities', 'Transportation', 'Insurance'],
      bills: bills.filter(bill => 
        ['Housing', 'Utilities', 'Transportation', 'Insurance'].includes(bill.category) &&
        !['Netflix', 'Spotify', 'Gym', 'Entertainment'].some(keyword => 
          bill.name.toLowerCase().includes(keyword.toLowerCase())
        )
      )
    },
    'negotiable': {
      categories: ['Entertainment', 'Subscriptions', 'Dining', 'Shopping'],
      bills: bills.filter(bill => 
        ['Entertainment', 'Subscriptions', 'Dining', 'Shopping'].includes(bill.category) ||
        ['Netflix', 'Spotify', 'Gym', 'Amazon Prime', 'Disney', 'Hulu'].some(keyword => 
          bill.name.toLowerCase().includes(keyword.toLowerCase())
        )
      )
    },
    'lifestyle': {
      categories: ['Living', 'Health', 'Personal'],
      bills: bills.filter(bill => 
        ['Living', 'Health', 'Personal'].includes(bill.category) &&
        !['Rent', 'Mortgage', 'Groceries'].some(keyword => 
          bill.name.toLowerCase().includes(keyword.toLowerCase())
        )
      )
    }
  }

  // Non-negotiable expenses - focus on optimization, not elimination
  if (billCategories['non-negotiable'].bills.length > 0) {
    const total = billCategories['non-negotiable'].bills.reduce((sum, bill) => sum + bill.amount, 0)
    const percentage = (total / monthlyIncome) * 100
    
    suggestions.push({
      category: 'Essential Expenses (Non-Negotiable)',
      type: 'non-negotiable',
      totalAmount: total,
      bills: billCategories['non-negotiable'].bills.map(b => b.name),
      suggestions: [
        percentage > 50 ? 'Consider refinancing or downsizing to reduce housing costs' : 'Shop around for better insurance rates annually',
        'Bundle utilities or switch to energy-efficient options for savings',
        'Refinance auto loans if rates have improved since purchase',
        'Review insurance coverage - remove unnecessary add-ons but keep essential protection'
      ],
      potentialSavings: Math.min(total * 0.15, 200), // Conservative 10-15% savings
      priority: 3
    })
  }

  // Negotiable expenses - can be reduced or eliminated
  if (billCategories['negotiable'].bills.length > 0) {
    const total = billCategories['negotiable'].bills.reduce((sum, bill) => sum + bill.amount, 0)
    
    suggestions.push({
      category: 'Entertainment & Subscriptions (Negotiable)',
      type: 'negotiable',
      totalAmount: total,
      bills: billCategories['negotiable'].bills.map(b => b.name),
      suggestions: [
        'Cancel unused subscriptions - average household has 3.4 unused services',
        'Share family plans instead of individual subscriptions',
        'Use free alternatives: YouTube instead of premium music, library books/movies',
        'Set entertainment budget and stick to it - consider cash envelope method',
        'Pause subscriptions during debt payoff sprint (temporary sacrifice for freedom)'
      ],
      potentialSavings: Math.min(total * 0.70, 300), // Can save 50-70%
      priority: 1
    })
  }

  // Lifestyle expenses - partially negotiable
  if (billCategories['lifestyle'].bills.length > 0) {
    const total = billCategories['lifestyle'].bills.reduce((sum, bill) => sum + bill.amount, 0)
    
    suggestions.push({
      category: 'Lifestyle & Personal (Partially Negotiable)',
      type: 'lifestyle',
      totalAmount: total,
      bills: billCategories['lifestyle'].bills.map(b => b.name),
      suggestions: [
        'Meal prep and cook at home more - can save $200-400/month on dining out',
        'Shop with a list and avoid impulse purchases',
        'Buy generic brands for household items (often 20-30% cheaper)',
        'Use the 24-hour rule for non-essential purchases over $50',
        'Find free alternatives: home workouts vs gym, library events vs paid entertainment'
      ],
      potentialSavings: Math.min(total * 0.40, 250), // 30-40% savings possible
      priority: 2
    })
  }

  // Check for high expense ratios
  const totalBills = bills.reduce((sum, bill) => sum + bill.amount, 0)
  const expenseRatio = (totalBills / monthlyIncome) * 100

  if (expenseRatio > 70) {
    suggestions.unshift({
      category: '🚨 High Expense Alert',
      type: 'non-negotiable',
      totalAmount: totalBills,
      bills: ['Total monthly expenses'],
      suggestions: [
        'Your expenses are over 70% of income - this makes debt payoff very difficult',
        'Consider increasing income through side hustle, skills training, or job change',
        'Look into downsizing housing if it exceeds 30% of income',
        'Sell items you don\'t need to generate extra debt payments',
        'Consider temporary extreme measures: move in with family, sell car for cheaper option'
      ],
      potentialSavings: totalBills * 0.20,
      priority: 0
    })
  }

  return suggestions.sort((a, b) => a.priority - b.priority)
}

// Calendar and goal utilities
export const generateCalendarEvents = (
  bills: any[],
  payDates: string[],
  goals: any[],
  debts: any[]
): any[] => {
  const events: any[] = []
  const today = new Date()
  const threeMonthsOut = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate())
  
  // Add paycheck events
  payDates.forEach((date, index) => {
    const payDate = new Date(date + 'T00:00:00')
    if (payDate <= threeMonthsOut) {
      events.push({
        id: `paycheck_${index}`,
        title: 'Paycheck',
        date: date,
        type: 'paycheck',
        amount: 0, // Will be filled by component
        status: payDate < today ? 'paid' : 'upcoming',
        category: 'income'
      })
    }
  })
  
  // Add bill events (recurring for next 3 months)
  bills.filter(bill => bill.isActive).forEach(bill => {
    const startDate = new Date(bill.dueDate + 'T00:00:00')
    let currentDate = new Date(startDate)
    
    // Generate occurrences for next 3 months
    while (currentDate <= threeMonthsOut) {
      events.push({
        id: `bill_${bill.id}_${currentDate.toISOString().split('T')[0]}`,
        title: bill.name,
        date: currentDate.toISOString().split('T')[0],
        type: 'bill',
        amount: bill.amount,
        status: currentDate < today ? 'paid' : 'upcoming',
        relatedId: bill.id,
        category: bill.category
      })
      
      // Calculate next occurrence based on frequency
      switch (bill.frequency) {
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7)
          break
        case 'bi-weekly':
          currentDate.setDate(currentDate.getDate() + 14)
          break
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1)
          break
        case 'quarterly':
          currentDate.setMonth(currentDate.getMonth() + 3)
          break
        case 'annual':
          currentDate.setFullYear(currentDate.getFullYear() + 1)
          break
        default:
          currentDate.setMonth(currentDate.getMonth() + 1)
      }
    }
  })
  
  // Add goal milestone events
  goals.filter(goal => goal.isActive).forEach(goal => {
    const targetDate = new Date(goal.targetDate + 'T00:00:00')
    if (targetDate <= threeMonthsOut) {
      const progress = goal.currentAmount / goal.targetAmount
      events.push({
        id: `goal_${goal.id}`,
        title: `${goal.name} Target`,
        date: goal.targetDate,
        type: 'goal_milestone',
        amount: goal.targetAmount,
        status: progress >= 1 ? 'completed' : targetDate < today ? 'overdue' : 'upcoming',
        relatedId: goal.id,
        category: goal.type
      })
    }
  })
  
  // Add debt payment events
  debts.filter(debt => debt.isActive).forEach(debt => {
    const startDate = new Date(debt.dueDate + 'T00:00:00')
    let currentDate = new Date(startDate)
    
    // Generate monthly debt payments for next 3 months
    while (currentDate <= threeMonthsOut) {
      events.push({
        id: `debt_${debt.id}_${currentDate.toISOString().split('T')[0]}`,
        title: `${debt.name} Payment`,
        date: currentDate.toISOString().split('T')[0],
        type: 'debt_payment',
        amount: debt.minimumPayment,
        status: currentDate < today ? 'paid' : 'upcoming',
        relatedId: debt.id,
        category: 'debt'
      })
      
      currentDate.setMonth(currentDate.getMonth() + 1)
    }
  })
  
  return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

export const calculateGoalProgress = (goal: any): { progressPercentage: number; monthsRemaining: number; onTrack: boolean } => {
  const progressPercentage = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
  const targetDate = new Date(goal.targetDate)
  const today = new Date()
  const monthsRemaining = Math.max(0, Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30)))
  
  const remainingAmount = goal.targetAmount - goal.currentAmount
  const requiredMonthlyContribution = monthsRemaining > 0 ? remainingAmount / monthsRemaining : 0
  const onTrack = goal.monthlyContribution >= requiredMonthlyContribution || progressPercentage >= 100
  
  return {
    progressPercentage,
    monthsRemaining,
    onTrack
  }
}

export const generateGoalId = (): string => {
  return `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}