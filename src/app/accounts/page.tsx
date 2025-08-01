'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { Account, AccountCategory, StewardshipSettings } from '@/types'
import { getAccounts, saveAccounts, getSettingsFromStorage } from '@/utils/storage'
import { generateAccountId, formatCurrency, formatPercentage } from '@/utils/calculations'
import BudgetSuggestions from '@/components/BudgetSuggestions'

interface AccountFormData {
  nickname: string
  bankName: string
  accountType: 'checking' | 'savings'
  accountNumber: string
  category: AccountCategory
  payrollPercentage: number
  currentBalance: number
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [settings, setSettings] = useState<StewardshipSettings | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AccountFormData>()

  useEffect(() => {
    const loadedAccounts = getAccounts()
    const loadedSettings = getSettingsFromStorage()
    setAccounts(loadedAccounts)
    setSettings(loadedSettings)
  }, [])

  const onSubmit = (data: AccountFormData) => {
    const newAccount: Account = {
      id: generateAccountId(),
      nickname: data.nickname,
      bankName: data.bankName,
      accountType: data.accountType,
      accountNumber: data.accountNumber,
      currentBalance: data.currentBalance,
      payrollPercentage: data.payrollPercentage,
      category: data.category,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    const updatedAccounts = [...accounts, newAccount]
    setAccounts(updatedAccounts)
    saveAccounts(updatedAccounts)
    reset()
    setShowAddForm(false)
  }

  const deleteAccount = (accountId: string) => {
    if (confirm('Are you sure you want to delete this account?')) {
      const updatedAccounts = accounts.filter(account => account.id !== accountId)
      setAccounts(updatedAccounts)
      saveAccounts(updatedAccounts)
    }
  }

  const toggleAccountStatus = (accountId: string) => {
    const updatedAccounts = accounts.map(account => 
      account.id === accountId 
        ? { ...account, isActive: !account.isActive, updatedAt: new Date().toISOString() }
        : account
    )
    setAccounts(updatedAccounts)
    saveAccounts(updatedAccounts)
  }

  const getCategoryIcon = (category: AccountCategory) => {
    const icons = {
      tithing: '🙏',
      savings: '💰',
      bills: '📋',
      expenses: '🛒',
      debt: '💳'
    }
    return icons[category] || '🏦'
  }

  const getCategoryColor = (category: AccountCategory) => {
    const colors = {
      tithing: 'bg-faith-100 text-faith-800',
      savings: 'bg-green-100 text-green-800',
      bills: 'bg-blue-100 text-blue-800',
      expenses: 'bg-purple-100 text-purple-800',
      debt: 'bg-red-100 text-red-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  const totalPercentages = accounts
    .filter(account => account.isActive)
    .reduce((sum, account) => sum + account.payrollPercentage, 0)

  const remainingPercentage = 100 - totalPercentages

  const handleAddSuggestedAccount = (accountData: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newAccount: Account = {
      ...accountData,
      id: generateAccountId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    const updatedAccounts = [...accounts, newAccount]
    setAccounts(updatedAccounts)
    saveAccounts(updatedAccounts)
    setShowSuggestions(false)
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
                <h1 className="text-3xl font-bold text-gray-900">Account Management</h1>
              </div>
              <p className="text-gray-600 mt-1">
                Set up purpose-driven accounts for automatic payroll distribution - each account gets funded automatically based on percentages
              </p>
            </div>
            <button 
              onClick={() => setShowAddForm(true)}
              className="btn-primary"
            >
              Add Account
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Allocation Summary */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Payroll Allocation Summary</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600">Total Allocated</p>
              <p className="text-2xl font-bold text-blue-600">{formatPercentage(totalPercentages)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Remaining Available</p>
              <p className={`text-2xl font-bold ${100 - totalPercentages >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(100 - totalPercentages)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Net Income</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(settings.paycheckAmount)}</p>
            </div>
          </div>
          
          {totalPercentages > 100 && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">⚠️ Over-allocated!</p>
              <p className="text-red-700 text-sm">
                Your accounts total {formatPercentage(totalPercentages)}, which exceeds 100%. 
                Please adjust your percentages.
              </p>
            </div>
          )}
          
          {remainingPercentage > 0 && remainingPercentage <= 100 && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-800 font-medium">💡 Complete Your Budget</p>
                  <p className="text-blue-700 text-sm">
                    You have {formatPercentage(remainingPercentage)} ({formatCurrency((settings.paycheckAmount * remainingPercentage) / 100)}) unallocated. 
                    Every dollar should have a purpose!
                  </p>
                </div>
                <button
                  onClick={() => setShowSuggestions(true)}
                  className="btn-primary whitespace-nowrap"
                >
                  Get Suggestions
                </button>
              </div>
            </div>
          )}
          
          {totalPercentages === 100 && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">🎉 Perfect Budget!</p>
              <p className="text-green-700 text-sm">
                Your accounts total exactly 100%. Every dollar has a purpose - excellent stewardship!
              </p>
            </div>
          )}
        </div>

        {/* Account List */}
        <div className="space-y-4">
          {accounts.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-6xl mb-6">🏦</div>
              <h3 className="text-xl font-semibold mb-4">No Accounts Yet</h3>
              <p className="text-gray-600 mb-6">
                Create purpose-driven accounts to organize your payroll distribution
              </p>
              <button onClick={() => setShowAddForm(true)} className="btn-primary">
                Add Your First Account
              </button>
            </div>
          ) : (
            accounts.map(account => (
              <div key={account.id} className={`card ${!account.isActive ? 'opacity-60' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">{getCategoryIcon(account.category)}</div>
                    <div>
                      <h3 className="text-lg font-semibold">{account.nickname}</h3>
                      <p className="text-gray-600">
                        {account.bankName} • {account.accountType} • •••{account.accountNumber}
                      </p>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(account.category)}`}>
                        {account.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center space-x-6">
                      <div>
                        <p className="text-sm text-gray-600">Percentage</p>
                        <p className="text-xl font-bold">{formatPercentage(account.payrollPercentage)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Per Paycheck</p>
                        <p className="text-xl font-bold">
                          {formatCurrency((settings.paycheckAmount * account.payrollPercentage) / 100)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Current Balance</p>
                        <p className="text-xl font-bold">{formatCurrency(account.currentBalance)}</p>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={() => toggleAccountStatus(account.id)}
                          className={`px-3 py-1 rounded text-xs font-medium ${
                            account.isActive 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {account.isActive ? 'Active' : 'Inactive'}
                        </button>
                        <button
                          onClick={() => deleteAccount(account.id)}
                          className="px-3 py-1 bg-red-100 text-red-800 hover:bg-red-200 rounded text-xs font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Account Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Add New Account</h2>
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
                      <label className="label">Account Nickname *</label>
                      <input
                        {...register('nickname', { required: 'Nickname is required' })}
                        className="input-field"
                        placeholder="Bills, Emergency Fund, House Savings..."
                      />
                      {errors.nickname && (
                        <p className="text-red-600 text-sm mt-1">{errors.nickname.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="label">Bank Name *</label>
                      <input
                        {...register('bankName', { required: 'Bank name is required' })}
                        className="input-field"
                        placeholder="Chase, Wells Fargo, Bank of America..."
                      />
                      {errors.bankName && (
                        <p className="text-red-600 text-sm mt-1">{errors.bankName.message}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="label">Account Type *</label>
                      <select {...register('accountType', { required: true })} className="input-field">
                        <option value="checking">Checking</option>
                        <option value="savings">Savings</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="label">Last 4 Digits *</label>
                      <input
                        {...register('accountNumber', { 
                          required: 'Account number is required',
                          pattern: { value: /^\d{4}$/, message: 'Must be 4 digits' }
                        })}
                        className="input-field"
                        placeholder="1234"
                        maxLength={4}
                      />
                      {errors.accountNumber && (
                        <p className="text-red-600 text-sm mt-1">{errors.accountNumber.message}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="label">Category *</label>
                    <select {...register('category', { required: true })} className="input-field">
                      {settings.tithingEnabled && <option value="tithing">🙏 Tithing/Giving</option>}
                      <option value="savings">💰 Savings/Emergency</option>
                      <option value="bills">📋 Bills</option>
                      <option value="expenses">🛒 Monthly Expenses</option>
                      <option value="debt">💳 Debt Payments</option>
                    </select>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="label">Payroll Percentage *</label>
                      <div className="flex items-center">
                        <input
                          {...register('payrollPercentage', { 
                            required: 'Percentage is required',
                            min: { value: 0, message: 'Must be positive' },
                            max: { value: 100, message: 'Cannot exceed 100%' }
                          })}
                          type="number"
                          step="0.1"
                          className="input-field"
                          placeholder="5.0"
                        />
                        <span className="ml-2 text-gray-500">%</span>
                      </div>
                      {errors.payrollPercentage && (
                        <p className="text-red-600 text-sm mt-1">{errors.payrollPercentage.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="label">Current Balance</label>
                      <div className="flex items-center">
                        <span className="text-gray-500 mr-2">$</span>
                        <input
                          {...register('currentBalance', { min: 0 })}
                          type="number"
                          step="0.01"
                          className="input-field"
                          placeholder="0.00"
                          defaultValue={0}
                        />
                      </div>
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
                      Add Account
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Budget Suggestions Modal */}
        {showSuggestions && settings && (
          <BudgetSuggestions
            remainingPercentage={remainingPercentage}
            paycheckAmount={settings.paycheckAmount}
            accounts={accounts}
            totalAllocated={totalPercentages}
            onAddAccount={handleAddSuggestedAccount}
            onClose={() => setShowSuggestions(false)}
          />
        )}
      </div>
    </div>
  )
}