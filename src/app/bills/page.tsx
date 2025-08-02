'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import { useForm } from 'react-hook-form'
import { Bill, Account, StewardshipSettings } from '@/types'
import { getBills, saveBills, getAccounts, getSettingsFromStorage } from '@/utils/storage'
import { generateBillId, formatCurrency, formatPercentage, calculateBillPercentage, calculateAccountBalances, AccountBalanceInfo } from '@/utils/calculations'

interface BillFormData {
  name: string
  amount: number
  dueDate: string
  accountId: string
  frequency: 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'annual'
  category: string
}

const BILL_TEMPLATES = [
  { name: 'Rent/Mortgage', category: 'Housing', amount: 1200 },
  { name: 'Electric Bill', category: 'Utilities', amount: 120 },
  { name: 'Water Bill', category: 'Utilities', amount: 45 },
  { name: 'Gas Bill', category: 'Utilities', amount: 80 },
  { name: 'Internet', category: 'Utilities', amount: 60 },
  { name: 'Phone', category: 'Utilities', amount: 50 },
  { name: 'Car Payment', category: 'Transportation', amount: 350 },
  { name: 'Car Insurance', category: 'Insurance', amount: 125 },
  { name: 'Health Insurance', category: 'Insurance', amount: 200 },
  { name: 'Groceries', category: 'Living', amount: 400 },
  { name: 'Gas/Fuel', category: 'Transportation', amount: 200 },
  { name: 'Netflix', category: 'Entertainment', amount: 15 },
  { name: 'Spotify', category: 'Entertainment', amount: 10 },
  { name: 'Gym Membership', category: 'Health', amount: 30 },
]

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [settings, setSettings] = useState<StewardshipSettings | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [editingBill, setEditingBill] = useState<Bill | null>(null)
  const [accountBalances, setAccountBalances] = useState<AccountBalanceInfo[]>([])
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<BillFormData>()
  
  const watchedAmount = watch('amount')

  useEffect(() => {
    const loadedBills = getBills()
    const loadedAccounts = getAccounts()
    const loadedSettings = getSettingsFromStorage()
    setBills(loadedBills)
    setAccounts(loadedAccounts)
    setSettings(loadedSettings)
    
    // Calculate account balances
    if (loadedAccounts.length > 0 && loadedSettings) {
      const balances = calculateAccountBalances(loadedAccounts, loadedBills, loadedSettings)
      setAccountBalances(balances)
    }
  }, [bills, accounts, settings])

  const onSubmit = (data: BillFormData) => {
    if (editingBill) {
      // Update existing bill
      const updatedBill: Bill = {
        ...editingBill,
        name: data.name,
        amount: data.amount,
        dueDate: data.dueDate,
        accountId: data.accountId,
        frequency: data.frequency,
        category: data.category,
        updatedAt: new Date().toISOString()
      }
      
      const updatedBills = bills.map(bill => 
        bill.id === editingBill.id ? updatedBill : bill
      )
      setBills(updatedBills)
      saveBills(updatedBills)
      setEditingBill(null)
    } else {
      // Create new bill
      const newBill: Bill = {
        id: generateBillId(),
        name: data.name,
        amount: data.amount,
        dueDate: data.dueDate,
        accountId: data.accountId,
        isRecurring: true,
        frequency: data.frequency,
        status: 'current',
        category: data.category,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      const updatedBills = [...bills, newBill]
      setBills(updatedBills)
      saveBills(updatedBills)
    }
    
    reset()
    setShowAddForm(false)
  }

  const startEdit = (bill: Bill) => {
    setEditingBill(bill)
    setShowAddForm(true)
    reset({
      name: bill.name,
      amount: bill.amount,
      dueDate: bill.dueDate,
      accountId: bill.accountId,
      frequency: bill.frequency,
      category: bill.category
    })
  }

  const deleteBill = (billId: string) => {
    if (confirm('Are you sure you want to delete this bill?')) {
      const updatedBills = bills.filter(bill => bill.id !== billId)
      setBills(updatedBills)
      saveBills(updatedBills)
    }
  }

  const toggleBillStatus = (billId: string) => {
    const updatedBills = bills.map(bill => 
      bill.id === billId 
        ? { ...bill, isActive: !bill.isActive, updatedAt: new Date().toISOString() }
        : bill
    )
    setBills(updatedBills)
    saveBills(updatedBills)
  }

  const useTemplate = (template: typeof BILL_TEMPLATES[0]) => {
    setValue('name', template.name)
    setValue('amount', template.amount)
    setValue('category', template.category)
    setShowTemplates(false)
  }

  const getStatusColor = (status: string) => {
    const colors = {
      current: 'bg-green-100 text-green-800',
      behind: 'bg-red-100 text-red-800',
      ahead: 'bg-blue-100 text-blue-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const totalBillsAmount = bills
    .filter(bill => bill.isActive)
    .reduce((sum, bill) => sum + bill.amount, 0)

  const totalBillsPercentage = settings ? 
    (totalBillsAmount / settings.paycheckAmount) * 100 : 0

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
                <h1 className="text-3xl font-bold text-gray-900">Bills & Expenses</h1>
              </div>
              <p className="text-gray-600 mt-1">
                Add your recurring bills to see automatic payroll percentages
              </p>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowTemplates(true)}
                className="btn-secondary"
              >
                Use Template
              </button>
              <button 
                onClick={() => setShowAddForm(true)}
                className="btn-primary"
              >
                Add Bill
              </button>
              <Navigation />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Bills Summary - THE SECRET SAUCE! */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">💡 Smart Payroll Calculator</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600">Total Bills</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalBillsAmount)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Bills Percentage</p>
              <p className={`text-2xl font-bold ${totalBillsPercentage > 80 ? 'text-red-600' : 'text-blue-600'}`}>
                {formatPercentage(totalBillsPercentage)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Net Income</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(settings.paycheckAmount)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Remaining After Bills</p>
              <p className={`text-2xl font-bold ${
                settings.paycheckAmount - totalBillsAmount >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(settings.paycheckAmount - totalBillsAmount)}
              </p>
            </div>
          </div>
          
          {settings.faithBasedMode && (
            <div className="mt-6 p-4 bg-faith-50 border border-faith-200 rounded-lg">
              <h3 className="font-semibold text-faith-800 flex items-center">
                🙏 Biblical Financial Order
              </h3>
              <div className="text-sm text-faith-700 mt-2 grid md:grid-cols-3 gap-4">
                <div>
                  <span className="font-medium">1. Honor God First:</span>
                  <p>{formatPercentage(settings.tithingPercentage)} ({formatCurrency((settings.paycheckAmount * settings.tithingPercentage) / 100)})</p>
                </div>
                <div>
                  <span className="font-medium">2. Pay Yourself:</span>
                  <p>{formatPercentage(settings.emergencyFundPercentage)} ({formatCurrency((settings.paycheckAmount * settings.emergencyFundPercentage) / 100)})</p>
                </div>
                <div>
                  <span className="font-medium">3. Cover Bills:</span>
                  <p>{formatPercentage(totalBillsPercentage)} ({formatCurrency(totalBillsAmount)})</p>
                </div>
              </div>
            </div>
          )}
          
          {totalBillsPercentage > 90 && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">⚠️ High Bill Allocation</p>
              <p className="text-red-700 text-sm">
                Your bills use {formatPercentage(totalBillsPercentage)} of your income. 
                Consider ways to reduce expenses or increase income.
              </p>
            </div>
          )}
        </div>

        {/* Account Balance Overview */}
        {accountBalances.length > 0 && (
          <div className="card mb-8">
            <h2 className="text-xl font-semibold mb-4">💰 Account Balance Preview</h2>
            <p className="text-gray-600 mb-4 text-sm">
              See how your accounts will look after monthly payroll deposits and bill payments
            </p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accountBalances.map(balance => (
                <div key={balance.accountId} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{balance.accountName}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Starting balance:</span>
                      <span className="font-medium">{formatCurrency(balance.startingBalance)}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Monthly inflow:</span>
                      <span className="font-medium">+{formatCurrency(balance.monthlyInflow)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Monthly bills:</span>
                      <span className="font-medium">-{formatCurrency(balance.monthlyOutflow)}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-semibold">
                      <span>Ending balance:</span>
                      <span className={balance.endingBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(balance.endingBalance)}
                      </span>
                    </div>
                    {balance.billsCount > 0 && (
                      <div className="text-xs text-gray-500 mt-2">
                        {balance.billsCount} bills • {formatPercentage(balance.utilization)} utilized
                      </div>
                    )}
                    {balance.utilization > 90 && (
                      <div className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded mt-1">
                        ⚠️ High utilization
                      </div>
                    )}
                    {balance.endingBalance < 0 && (
                      <div className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded mt-1">
                        ⚠️ Negative balance
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bills List */}
        <div className="space-y-4">
          {bills.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-6xl mb-6">📋</div>
              <h3 className="text-xl font-semibold mb-4">No Bills Added Yet</h3>
              <p className="text-gray-600 mb-6">
                Add your recurring bills to see automatic payroll percentage calculations
              </p>
              <div className="flex justify-center space-x-4">
                <button onClick={() => setShowTemplates(true)} className="btn-secondary">
                  Use Templates
                </button>
                <button onClick={() => setShowAddForm(true)} className="btn-primary">
                  Add First Bill
                </button>
              </div>
            </div>
          ) : (
            bills.map(bill => {
              const account = accounts.find(acc => acc.id === bill.accountId)
              const billPercentage = calculateBillPercentage(bill.amount, settings.paycheckAmount)
              
              return (
                <div key={bill.id} className={`card ${!bill.isActive ? 'opacity-60' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl">📋</div>
                      <div>
                        <h3 className="text-lg font-semibold">{bill.name}</h3>
                        <p className="text-gray-600">
                          Due: {new Date(bill.dueDate).toLocaleDateString()} • 
                          {bill.frequency} • {bill.category}
                        </p>
                        {account && (
                          <p className="text-sm text-gray-500">
                            Paid from: {account.nickname}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center space-x-6">
                        <div>
                          <p className="text-sm text-gray-600">Amount</p>
                          <p className="text-xl font-bold">{formatCurrency(bill.amount)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Percentage</p>
                          <p className="text-xl font-bold text-blue-600">
                            {formatPercentage(billPercentage)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bill.status)}`}>
                            {bill.status}
                          </span>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <button
                            onClick={() => startEdit(bill)}
                            className="px-3 py-1 bg-blue-100 text-blue-800 hover:bg-blue-200 rounded text-xs font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => toggleBillStatus(bill.id)}
                            className={`px-3 py-1 rounded text-xs font-medium ${
                              bill.isActive 
                                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            }`}
                          >
                            {bill.isActive ? 'Active' : 'Inactive'}
                          </button>
                          <button
                            onClick={() => deleteBill(bill.id)}
                            className="px-3 py-1 bg-red-100 text-red-800 hover:bg-red-200 rounded text-xs font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Quick Actions */}
        {bills.length > 0 && (
          <div className="card mt-8">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-4">
              <Link href="/calculator" className="btn-primary">
                View Payroll Calculator
              </Link>
              <Link href="/accounts" className="btn-secondary">
                Manage Accounts
              </Link>
              <button onClick={() => setShowAddForm(true)} className="btn-secondary">
                Add Another Bill
              </button>
            </div>
          </div>
        )}

        {/* Templates Modal */}
        {showTemplates && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Choose a Template</h2>
                  <button 
                    onClick={() => setShowTemplates(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {BILL_TEMPLATES.map((template, index) => (
                    <div 
                      key={index}
                      onClick={() => useTemplate(template)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 cursor-pointer transition-colors"
                    >
                      <h3 className="font-semibold">{template.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{template.category}</p>
                      <p className="text-lg font-bold text-primary-600">{formatCurrency(template.amount)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatPercentage(calculateBillPercentage(template.amount, settings.paycheckAmount))} of income
                      </p>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 text-center">
                  <button 
                    onClick={() => { setShowTemplates(false); setShowAddForm(true); }}
                    className="btn-primary"
                  >
                    Add Custom Bill Instead
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Bill Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">{editingBill ? 'Edit Bill' : 'Add New Bill'}</h2>
                  <button 
                    onClick={() => setShowAddForm(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>
                
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="label">Bill Name *</label>
                      <input
                        {...register('name', { required: 'Bill name is required' })}
                        className="input-field"
                        placeholder="Rent, Electric Bill, Car Payment..."
                      />
                      {errors.name && (
                        <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="label">Amount *</label>
                      <div className="flex items-center">
                        <span className="text-gray-500 mr-2">$</span>
                        <input
                          {...register('amount', { 
                            required: 'Amount is required',
                            min: { value: 0.01, message: 'Must be greater than 0' }
                          })}
                          type="number"
                          step="0.01"
                          className="input-field"
                          placeholder="350.00"
                        />
                      </div>
                      {watchedAmount && settings && (
                        <p className="text-sm text-blue-600 mt-1">
                          {formatPercentage(calculateBillPercentage(watchedAmount, settings.paycheckAmount))} of each paycheck
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Enter monthly bill amounts - we'll calculate the per-paycheck percentage
                      </p>
                      {errors.amount && (
                        <p className="text-red-600 text-sm mt-1">{errors.amount.message}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="label">Due Date *</label>
                      <input
                        {...register('dueDate', { required: 'Due date is required' })}
                        type="date"
                        className="input-field"
                      />
                      {errors.dueDate && (
                        <p className="text-red-600 text-sm mt-1">{errors.dueDate.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="label">Frequency *</label>
                      <select {...register('frequency', { required: true })} className="input-field">
                        <option value="monthly">Monthly</option>
                        <option value="bi-weekly">Bi-weekly</option>
                        <option value="weekly">Weekly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="annual">Annual</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="label">Category</label>
                      <input
                        {...register('category')}
                        className="input-field"
                        placeholder="Housing, Utilities, Transportation..."
                        defaultValue="Bills"
                      />
                    </div>
                    
                    <div>
                      <label className="label">Pay From Account</label>
                      <select {...register('accountId')} className="input-field">
                        <option value="">Select Account (Optional)</option>
                        {accounts.filter(acc => acc.isActive).map(account => (
                          <option key={account.id} value={account.id}>
                            {account.nickname} ({account.category})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 pt-6">
                    <button 
                      type="button" 
                      onClick={() => setShowAddForm(false)}
                      className="btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary flex-1">
{editingBill ? 'Update Bill' : 'Add Bill'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
