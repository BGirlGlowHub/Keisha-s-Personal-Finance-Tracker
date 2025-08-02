'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navigation from'@/components/Navigation'
import { Account, Bill, StewardshipSettings } from '@/types'
import { getAccounts, getBills, getSettingsFromStorage } from '@/utils/storage'
import { formatCurrency, formatPercentage, calculateBillPercentage } from '@/utils/calculations'

interface PayrollBreakdown {
  category: string
  items: {
    name: string
    amount: number
    percentage: number
    icon: string
    color: string
  }[]
  totalAmount: number
  totalPercentage: number
}

export default function CalculatorPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [bills, setBills] = useState<Bill[]>([])
  const [settings, setSettings] = useState<StewardshipSettings | null>(null)
  const [breakdown, setBreakdown] = useState<PayrollBreakdown[]>([])

  useEffect(() => {
    const loadedAccounts = getAccounts()
    const loadedBills = getBills()
    const loadedSettings = getSettingsFromStorage()
    
    setAccounts(loadedAccounts)
    setBills(loadedBills)
    setSettings(loadedSettings)
    
    if (loadedSettings) {
      calculateBreakdown(loadedAccounts, loadedBills, loadedSettings)
    }
  }, [])

  const calculateBreakdown = (
    accountsData: Account[], 
    billsData: Bill[], 
    settingsData: StewardshipSettings
  ) => {
    const activeAccounts = accountsData.filter(acc => acc.isActive)
    const activeBills = billsData.filter(bill => bill.isActive)
    
    const breakdownData: PayrollBreakdown[] = []
    
    // 1. Tithing (if enabled)
    if (settingsData.tithingEnabled) {
      const tithingAmount = (settingsData.paycheckAmount * settingsData.tithingPercentage) / 100
      breakdownData.push({
        category: 'Honor God First',
        items: [{
          name: 'Tithing/Giving',
          amount: tithingAmount,
          percentage: settingsData.tithingPercentage,
          icon: '🙏',
          color: 'text-faith-600'
        }],
        totalAmount: tithingAmount,
        totalPercentage: settingsData.tithingPercentage
      })
    }
    
    // 2. Savings/Emergency Fund  
    const savingsAmount = (settingsData.paycheckAmount * settingsData.emergencyFundPercentage) / 100
    breakdownData.push({
      category: 'Pay Yourself Second',
      items: [{
        name: 'Emergency Fund/Savings',
        amount: savingsAmount,
        percentage: settingsData.emergencyFundPercentage,
        icon: '💰',
        color: 'text-green-600'
      }],
      totalAmount: savingsAmount,
      totalPercentage: settingsData.emergencyFundPercentage
    })
    
    // 3. Bills by Category
    const billsByCategory: Record<string, typeof activeBills> = {}
    activeBills.forEach(bill => {
      const category = bill.category || 'Other Bills'
      if (!billsByCategory[category]) {
        billsByCategory[category] = []
      }
      billsByCategory[category].push(bill)
    })
    
    Object.entries(billsByCategory).forEach(([category, categoryBills]) => {
      const items = categoryBills.map(bill => ({
        name: bill.name,
        amount: bill.amount,
        percentage: calculateBillPercentage(bill.amount, settingsData.paycheckAmount),
        icon: '📋',
        color: 'text-blue-600'
      }))
      
      const totalAmount = categoryBills.reduce((sum, bill) => sum + bill.amount, 0)
      const totalPercentage = (totalAmount / settingsData.paycheckAmount) * 100
      
      breakdownData.push({
        category: `${category} Bills`,
        items,
        totalAmount,
        totalPercentage
      })
    })
    
    // 4. Account Allocations (that aren't already covered)
    const accountsByCategory: Record<string, typeof activeAccounts> = {}
    activeAccounts.forEach(account => {
      if (account.category !== 'tithing') { // Tithing handled separately
        const category = account.category === 'savings' ? 'Additional Savings' : 
                        account.category === 'expenses' ? 'Monthly Expenses' :
                        account.category === 'debt' ? 'Debt Payments' : 'Other Accounts'
        
        if (!accountsByCategory[category]) {
          accountsByCategory[category] = []
        }
        accountsByCategory[category].push(account)
      }
    })
    
    Object.entries(accountsByCategory).forEach(([category, categoryAccounts]) => {
      if (categoryAccounts.length > 0) {
        const items = categoryAccounts.map(account => ({
          name: account.nickname,
          amount: (settingsData.paycheckAmount * account.payrollPercentage) / 100,
          percentage: account.payrollPercentage,
          icon: account.category === 'savings' ? '💰' : 
                account.category === 'expenses' ? '🛒' :
                account.category === 'debt' ? '💳' : '🏦',
          color: account.category === 'savings' ? 'text-green-600' :
                 account.category === 'expenses' ? 'text-purple-600' :
                 account.category === 'debt' ? 'text-red-600' : 'text-gray-600'
        }))
        
        const totalAmount = items.reduce((sum, item) => sum + item.amount, 0)
        const totalPercentage = items.reduce((sum, item) => sum + item.percentage, 0)
        
        breakdownData.push({
          category,
          items,
          totalAmount,
          totalPercentage
        })
      }
    })
    
    setBreakdown(breakdownData)
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Setup Required</h1>
          <p className="text-gray-600 mb-6">Please complete the setup first</p>
          <Link href="/setup" className="btn-primary">
            Go to Setup
          </Link>
        </div>
      </div>
    )
  }

  const totalAllocated = breakdown.reduce((sum, section) => sum + section.totalPercentage, 0)
  const remainingPercentage = 100 - totalAllocated
  const remainingAmount = settings.paycheckAmount - (settings.paycheckAmount * totalAllocated / 100)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-4">
                <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                  ← Dashboard
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">Smart Payroll Calculator</h1>
              </div>
              <p className="text-gray-600 mt-1">
                Your complete PER-PAYCHECK distribution breakdown for multiple bank accounts
              </p>
              <p className="text-sm text-blue-600 mt-2">
                💡 Take these percentages to HR/Payroll to set up automatic direct deposit splits for EACH paycheck - your bills will be paid before you even see the money!
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Net Paycheck</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(settings.paycheckAmount)}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Allocated</p>
                <p className="text-2xl font-bold text-blue-600">{formatPercentage(totalAllocated)}</p>
              </div>
              <div className="text-3xl">📊</div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Remaining</p>
                <p className={`text-2xl font-bold ${remainingPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(remainingPercentage)}
                </p>
              </div>
              <div className="text-3xl">✨</div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Available Cash</p>
                <p className={`text-2xl font-bold ${remainingAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(remainingAmount)}
                </p>
              </div>
              <div className="text-3xl">💵</div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-gray-900">{breakdown.length}</p>
              </div>
              <div className="text-3xl">📋</div>
            </div>
          </div>
        </div>

        {/* The Secret Sauce - Detailed Breakdown */}
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">🎯 THE SECRET SAUCE: Your Payroll Distribution</h2>
            <div className="text-right text-sm text-gray-600">
              <p>Take these percentages to HR/Payroll</p>
              <p>Set up automatic distributions</p>
            </div>
          </div>
          
          {settings.faithBasedMode && (
            <div className="bg-faith-50 border border-faith-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-faith-800 mb-2">🙏 Biblical Financial Order</h3>
              <p className="text-faith-700 text-sm">
                "Honor the Lord with your wealth, with the firstfruits of all your crops" - Proverbs 3:9
              </p>
              <p className="text-faith-600 text-xs mt-1">
                Your money flows in biblical order: God first, yourself second, obligations third
              </p>
            </div>
          )}
          
          <div className="space-y-6">
            {breakdown.map((section, sectionIndex) => (
              <div key={sectionIndex} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{section.category}</h3>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{formatPercentage(section.totalPercentage)}</p>
                    <p className="text-sm text-gray-600">{formatCurrency(section.totalAmount)}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {section.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{item.icon}</span>
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${item.color}`}>
                          {formatPercentage(item.percentage)}
                        </p>
                        <p className="text-sm text-gray-600">{formatCurrency(item.amount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {/* Remaining Balance */}
            {remainingPercentage > 0 && (
              <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">✨</span>
                    <span className="font-medium text-green-800">Available for Discretionary Spending</span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      {formatPercentage(remainingPercentage)}
                    </p>
                    <p className="text-sm text-green-700">{formatCurrency(remainingAmount)}</p>
                  </div>
                </div>
                <p className="text-xs text-green-600 mt-2">
                  This is your guilt-free spending money after faithful stewardship!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Items */}
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">📋 Next Steps</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-3">
                <span className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <span>Open separate bank accounts for each category (Bills, Savings, etc.)</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <span>Take these exact percentages to your HR/Payroll department</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <span>Set up automatic direct deposit splits based on percentages</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                <span>Bills, debts, and savings get funded automatically before you see the money!</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="w-6 h-6 bg-faith-500 text-white rounded-full flex items-center justify-center text-xs font-bold">5</span>
                <span>Walk in financial peace and faithful stewardship - never worry about bills again!</span>
              </div>
            </div>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">⚠️ Budget Health Check</h3>
            <div className="space-y-3">
              {totalAllocated > 100 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 font-medium">Over-allocated!</p>
                  <p className="text-red-700 text-sm">Reduce expenses or increase income</p>
                </div>
              )}
              
              {totalAllocated > 95 && totalAllocated <= 100 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 font-medium">Very tight budget</p>
                  <p className="text-yellow-700 text-sm">Consider building in more buffer</p>
                </div>
              )}
              
              {totalAllocated <= 95 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium">Healthy budget!</p>
                  <p className="text-green-700 text-sm">Good balance with room to breathe</p>
                </div>
              )}
              
              <div className="text-sm text-gray-600">
                <p className="font-medium">Budget Recommendations:</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Keep total allocation under 95%</li>
                  <li>Leave 5-10% buffer for unexpected expenses</li>
                  <li>Review and adjust monthly</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card mt-8">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-4">
            <Link href="/accounts" className="btn-primary">
              Adjust Accounts
            </Link>
            <Link href="/bills" className="btn-secondary">
              Modify Bills
            </Link>
            <Link href="/setup" className="btn-secondary">
              Change Settings
            </Link>
            <button 
              onClick={() => window.print()}
              className="btn-secondary"
            >
              Print Summary
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
