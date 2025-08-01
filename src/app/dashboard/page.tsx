'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Account, Bill, Debt, StewardshipSettings, FinancialSummary } from '@/types'
import { getAccounts, getBills, getDebts, getSettingsFromStorage } from '@/utils/storage'
import { calculateFinancialSummary, calculateCurrentMonthIncome, formatCurrency, formatPercentage } from '@/utils/calculations'
import { loadSampleData, clearAllSampleData } from '@/utils/sampleData'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export default function DashboardPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [bills, setBills] = useState<Bill[]>([])
  const [debts, setDebts] = useState<Debt[]>([])
  const [settings, setSettings] = useState<StewardshipSettings | null>(null)
  const [summary, setSummary] = useState<FinancialSummary | null>(null)

  useEffect(() => {
    const loadedAccounts = getAccounts()
    const loadedBills = getBills()
    const loadedDebts = getDebts()
    const loadedSettings = getSettingsFromStorage()
    
    setAccounts(loadedAccounts)
    setBills(loadedBills)
    setDebts(loadedDebts)
    setSettings(loadedSettings)
    
    if (loadedSettings) {
      const calculatedSummary = calculateFinancialSummary(loadedAccounts, loadedBills, loadedSettings)
      setSummary(calculatedSummary)
    }
  }, [])

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

  const getNextSteps = () => {
    if (accounts.length === 0) {
      return "Add your first account to get started"
    }
    if (bills.length === 0) {
      return "Add your bills to see automatic percentage calculations"
    }
    return "Your stewardship system is ready! Add more accounts or bills as needed."
  }

  const getChartData = () => {
    if (!settings) return { pieData: [], barData: [] }
    
    const pieData = []
    const barData = []
    
    const monthlyIncome = calculateCurrentMonthIncome(settings.paycheckAmount, settings.payFrequency, settings.payDates || [])
    
    // Tithing
    if (settings.tithingEnabled) {
      const tithingAmount = (monthlyIncome * settings.tithingPercentage) / 100
      pieData.push({ name: 'Tithing', value: tithingAmount, percentage: settings.tithingPercentage })
      barData.push({ category: 'Tithing', amount: tithingAmount, percentage: settings.tithingPercentage })
    }
    
    // Emergency Fund
    const emergencyAmount = (monthlyIncome * settings.emergencyFundPercentage) / 100
    pieData.push({ name: 'Emergency Fund', value: emergencyAmount, percentage: settings.emergencyFundPercentage })
    barData.push({ category: 'Emergency Fund', amount: emergencyAmount, percentage: settings.emergencyFundPercentage })
    
    // Bills by category
    const billsByCategory: Record<string, Bill[]> = {}
    bills.filter(bill => bill.isActive).forEach(bill => {
      const category = bill.category || 'Other Bills'
      if (!billsByCategory[category]) billsByCategory[category] = []
      billsByCategory[category].push(bill)
    })
    
    Object.entries(billsByCategory).forEach(([category, categoryBills]) => {
      const totalAmount = categoryBills.reduce((sum, bill) => sum + bill.amount, 0)
      const percentage = (totalAmount / monthlyIncome) * 100
      pieData.push({ name: category, value: totalAmount, percentage })
      barData.push({ category, amount: totalAmount, percentage })
    })
    
    // Account allocations
    accounts.filter(acc => acc.isActive && acc.category !== 'tithing').forEach(account => {
      const amount = (monthlyIncome * account.payrollPercentage) / 100
      if (amount > 0) {
        pieData.push({ name: account.nickname, value: amount, percentage: account.payrollPercentage })
        barData.push({ category: account.nickname, amount, percentage: account.payrollPercentage })
      }
    })
    
    // Remaining balance
    const totalAllocated = summary?.allocationPercentage || 0
    if (100 - totalAllocated > 0) {
      const remainingAmount = monthlyIncome * (100 - totalAllocated) / 100
      pieData.push({ name: 'Available', value: remainingAmount, percentage: 100 - totalAllocated })
      barData.push({ category: 'Available', amount: remainingAmount, percentage: 100 - totalAllocated })
    }
    
    return { pieData, barData }
  }

  const { pieData, barData } = getChartData()
  
  const totalDebtBalance = debts.filter(debt => debt.isActive).reduce((sum, debt) => sum + debt.currentBalance, 0)
  const totalDebtPayments = debts.filter(debt => debt.isActive).reduce((sum, debt) => sum + debt.minimumPayment, 0)

  const loadSampleDataAndRefresh = () => {
    loadSampleData()
    window.location.reload()
  }

  const clearDataAndRefresh = () => {
    if (confirm('This will clear all your data. Are you sure?')) {
      clearAllSampleData()
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Financial Dashboard - {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h1>
              <p className="text-gray-600 mt-1">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} • 
                {settings.faithBasedMode ? 'Faith-based stewardship' : 'Secular approach'} • 
                {settings.payFrequency.charAt(0).toUpperCase() + settings.payFrequency.slice(1).replace('-', ' ')}: {formatCurrency(settings.paycheckAmount)}
                {settings.nextPayDate && (
                  <span> • Next pay: {new Date(settings.nextPayDate + 'T00:00:00').toLocaleDateString()}</span>
                )}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/setup" className="btn-secondary">
                Edit Income/Schedule
              </Link>
              <Link href="/calendar" className="btn-primary">
                Calendar
              </Link>
              <Link href="/goals" className="btn-secondary">
                Goals
              </Link>
              <Link href="/accounts" className="btn-secondary">
                Accounts
              </Link>
              <Link href="/bills" className="btn-secondary">
                Bills
              </Link>
              <Link href="/debts" className="btn-secondary">
                Debts
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Financial Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Income</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalIncome)}</p>
                </div>
                <div className="text-3xl">💰</div>
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Allocated</p>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary.totalAllocated)}</p>
                  <p className="text-xs text-gray-500">{formatPercentage(summary.allocationPercentage)}</p>
                </div>
                <div className="text-3xl">📊</div>
              </div>
            </div>
            
            {settings.tithingEnabled && (
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Tithing</p>
                    <p className="text-2xl font-bold text-faith-600">{formatCurrency(summary.totalTithing)}</p>
                    <p className="text-xs text-gray-500">{formatPercentage(settings.tithingPercentage)}</p>
                  </div>
                  <div className="text-3xl">🙏</div>
                </div>
              </div>
            )}
            
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Debt</p>
                  <p className={`text-2xl font-bold ${totalDebtBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {totalDebtBalance > 0 ? formatCurrency(totalDebtBalance) : 'Debt Free!'}
                  </p>
                  {totalDebtPayments > 0 && (
                    <p className="text-xs text-gray-500">{formatCurrency(totalDebtPayments)}/month</p>
                  )}
                  {totalDebtBalance > 0 && (
                    <p className="text-xs text-orange-600 font-medium mt-1">Temporary sacrifice → Financial freedom</p>
                  )}
                </div>
                <div className="text-3xl">{totalDebtBalance > 0 ? '💳' : '🎉'}</div>
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Available Balance</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.remainingBalance)}</p>
                  <p className="text-xs text-gray-500">
                    {formatPercentage(100 - summary.allocationPercentage)} remaining
                  </p>
                </div>
                <div className="text-3xl">✨</div>
              </div>
            </div>
          </div>
        )}

        {/* Faith-Based Message */}
        {settings.faithBasedMode && (
          <div className="bg-faith-50 border border-faith-200 rounded-lg p-6 mb-8">
            <div className="flex items-center">
              <div className="text-3xl mr-4">🙏</div>
              <div>
                <h3 className="text-lg font-semibold text-faith-800">Walking in Faithful Stewardship</h3>
                <p className="text-faith-700">
                  "Honor the Lord with your wealth, with the firstfruits of all your crops" - Proverbs 3:9
                </p>
                <p className="text-sm text-faith-600 mt-2">
                  Your tithe is set aside first ({formatPercentage(settings.tithingPercentage)}), 
                  ensuring faithful stewardship before all other obligations.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Financial Visualizations */}
        {pieData.length > 0 && (
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">💰 Income Distribution</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${formatPercentage(percentage)}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">📊 Allocation Breakdown</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="category" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={12}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'amount' ? formatCurrency(Number(value)) : formatPercentage(Number(value)),
                        name === 'amount' ? 'Amount' : 'Percentage'
                      ]}
                    />
                    <Bar dataKey="percentage" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Accounts Overview */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Your Accounts</h2>
              <Link href="/accounts" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                Manage All →
              </Link>
            </div>
            
            {accounts.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🏦</div>
                <p className="text-gray-600 mb-4">No accounts set up yet</p>
                <Link href="/accounts" className="btn-primary">
                  Add Your First Account
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {accounts.slice(0, 3).map(account => (
                  <div key={account.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium">{account.nickname}</h3>
                      <p className="text-sm text-gray-600">{account.bankName} • {account.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatPercentage(account.payrollPercentage)}</p>
                      <p className="text-sm text-gray-600">
                        {formatCurrency((calculateCurrentMonthIncome(settings.paycheckAmount, settings.payFrequency, settings.payDates || []) * account.payrollPercentage) / 100)}/month
                      </p>
                    </div>
                  </div>
                ))}
                {accounts.length > 3 && (
                  <p className="text-sm text-gray-500 text-center">
                    +{accounts.length - 3} more accounts
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Bills Overview */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Upcoming Bills</h2>
              <Link href="/bills" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                Manage All →
              </Link>
            </div>
            
            {bills.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📋</div>
                <p className="text-gray-600 mb-4">No bills added yet</p>
                <Link href="/bills" className="btn-primary">
                  Add Your First Bill
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {bills.slice(0, 3).map(bill => (
                  <div key={bill.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium">{bill.name}</h3>
                      <p className="text-sm text-gray-600">Due: {new Date(bill.dueDate).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(bill.amount)}</p>
                      <span className={`status-${bill.status}`}>
                        {bill.status}
                      </span>
                    </div>
                  </div>
                ))}
                {bills.length > 3 && (
                  <p className="text-sm text-gray-500 text-center">
                    +{bills.length - 3} more bills
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Next Steps */}
        <div className="card mt-8">
          <h2 className="text-xl font-semibold mb-4">Next Steps</h2>
          <p className="text-gray-600 mb-4">{getNextSteps()}</p>
          
          <div className="flex flex-wrap gap-4">
            <Link href="/calendar" className="btn-primary">
              View Calendar
            </Link>
            <Link href="/goals" className="btn-primary">
              Set Goals
            </Link>
            <Link href="/accounts" className="btn-secondary">
              Add Account
            </Link>
            <Link href="/bills" className="btn-secondary">
              Add Bill
            </Link>
            <Link href="/debts" className="btn-secondary">
              Track Debt
            </Link>
            <Link href="/calculator" className="btn-secondary">
              Payroll Calculator
            </Link>
            {summary && (100 - summary.allocationPercentage) > 0 && (
              <Link href="/accounts" className="px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg font-medium transition-colors">
                Complete Budget ({formatPercentage(100 - summary.allocationPercentage)} remaining)
              </Link>
            )}
          </div>
          
          {/* Educational Content */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold mb-3">💡 Account Separation Strategy</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-blue-800 text-sm mb-3">
                <strong>Why separate accounts work:</strong> By dividing your paycheck into specific purpose accounts, 
                you ensure money is available when bills are due and prevent overspending.
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">🏦 Account Categories:</h4>
                  <ul className="text-blue-700 space-y-1">
                    <li>• <strong>Bills:</strong> Fixed expenses (rent, utilities)</li>
                    <li>• <strong>Savings:</strong> Emergency fund, house fund</li>
                    <li>• <strong>Expenses:</strong> Variable costs (groceries, gas)</li>
                    <li>• <strong>Tithing:</strong> Honor God first (faith-based)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">⚡ The Secret:</h4>
                  <ul className="text-blue-700 space-y-1">
                    <li>• Money flows to accounts <em>before</em> you can spend it</li>
                    <li>• Each account has one purpose</li>
                    <li>• Bills are always covered automatically</li>
                    <li>• No more "where did my money go?"</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Demo Data Section */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold mb-3">🎯 Try the Demo</h3>
            <p className="text-gray-600 mb-4 text-sm">
              See the app in action with realistic sample data showcasing 10 different accounts and complete bill tracking
            </p>
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={loadSampleDataAndRefresh}
                className="btn-faith"
              >
                Load Demo Data
              </button>
              {(accounts.length > 0 || bills.length > 0 || debts.length > 0) && (
                <button 
                  onClick={clearDataAndRefresh}
                  className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-medium transition-colors"
                >
                  Clear All Data
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}