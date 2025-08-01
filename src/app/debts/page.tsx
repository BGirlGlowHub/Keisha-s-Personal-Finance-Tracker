'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { Debt, Account, StewardshipSettings } from '@/types'
import { getDebts, saveDebts, getAccounts, getSettingsFromStorage, getBills } from '@/utils/storage'
import { formatCurrency, formatPercentage, calculateDebtSnowball, calculateDebtAvalanche, calculateExtraPaymentImpact, DebtPayoffStrategy, calculateAccountBalances, getDebtReductionSuggestions, DebtReductionSuggestion } from '@/utils/calculations'

interface DebtFormData {
  name: string
  currentBalance: number
  minimumPayment: number
  interestRate: number
  accountId: string
  dueDate: string
}

const generateDebtId = (): string => {
  return `debt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export default function DebtsPage() {
  const [debts, setDebts] = useState<Debt[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [settings, setSettings] = useState<StewardshipSettings | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null)
  const [showStrategies, setShowStrategies] = useState(false)
  const [extraPayment, setExtraPayment] = useState(0)
  const [strategies, setStrategies] = useState<{snowball: DebtPayoffStrategy | null, avalanche: DebtPayoffStrategy | null}>({ snowball: null, avalanche: null })
  const [availableExcess, setAvailableExcess] = useState(0)
  const [reductionSuggestions, setReductionSuggestions] = useState<DebtReductionSuggestion[]>([])
  const [showReductionTips, setShowReductionTips] = useState(false)
  
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<DebtFormData>()
  
  const watchedBalance = watch('currentBalance')
  const watchedPayment = watch('minimumPayment')
  const watchedRate = watch('interestRate')

  useEffect(() => {
    const loadedDebts = getDebts()
    const loadedAccounts = getAccounts()
    const loadedSettings = getSettingsFromStorage()
    const loadedBills = getBills()
    setDebts(loadedDebts)
    setAccounts(loadedAccounts)
    setSettings(loadedSettings)
    
    // Calculate strategies when debts load
    if (loadedDebts.length > 0) {
      const activeDebts = loadedDebts.filter(debt => debt.isActive)
      if (activeDebts.length > 0) {
        const snowball = calculateDebtSnowball(activeDebts, extraPayment)
        const avalanche = calculateDebtAvalanche(activeDebts, extraPayment)
        setStrategies({ snowball, avalanche })
      }
    }
    
    // Calculate available excess from accounts
    if (loadedAccounts.length > 0 && loadedSettings) {
      const accountBalances = calculateAccountBalances(loadedAccounts, [], loadedSettings)
      const totalExcess = accountBalances.reduce((sum, balance) => {
        // Consider excess only if ending balance is positive and utilization is low
        if (balance.endingBalance > 500 && balance.utilization < 70) {
          return sum + Math.max(0, balance.endingBalance - 500) // Keep $500 buffer
        }
        return sum
      }, 0)
      setAvailableExcess(totalExcess)
    }
    
    // Calculate debt reduction suggestions
    if (loadedBills.length > 0 && loadedSettings) {
      const suggestions = getDebtReductionSuggestions(loadedBills, loadedAccounts, loadedSettings)
      setReductionSuggestions(suggestions)
    }
  }, [extraPayment])

  const onSubmit = (data: DebtFormData) => {
    if (editingDebt) {
      // Update existing debt
      const updatedDebt: Debt = {
        ...editingDebt,
        name: data.name,
        currentBalance: data.currentBalance,
        minimumPayment: data.minimumPayment,
        interestRate: data.interestRate,
        accountId: data.accountId,
        dueDate: data.dueDate,
        updatedAt: new Date().toISOString()
      }
      
      const updatedDebts = debts.map(debt => 
        debt.id === editingDebt.id ? updatedDebt : debt
      )
      setDebts(updatedDebts)
      saveDebts(updatedDebts)
      setEditingDebt(null)
    } else {
      // Create new debt
      const newDebt: Debt = {
        id: generateDebtId(),
        name: data.name,
        currentBalance: data.currentBalance,
        minimumPayment: data.minimumPayment,
        interestRate: data.interestRate,
        accountId: data.accountId,
        dueDate: data.dueDate,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      const updatedDebts = [...debts, newDebt]
      setDebts(updatedDebts)
      saveDebts(updatedDebts)
    }
    
    reset()
    setShowAddForm(false)
  }

  const startEdit = (debt: Debt) => {
    setEditingDebt(debt)
    setShowAddForm(true)
    reset({
      name: debt.name,
      currentBalance: debt.currentBalance,
      minimumPayment: debt.minimumPayment,
      interestRate: debt.interestRate,
      accountId: debt.accountId,
      dueDate: debt.dueDate
    })
  }

  const toggleDebtActive = (debtId: string) => {
    const updatedDebts = debts.map(debt =>
      debt.id === debtId ? { ...debt, isActive: !debt.isActive, updatedAt: new Date().toISOString() } : debt
    )
    setDebts(updatedDebts)
    saveDebts(updatedDebts)
  }

  const deleteDebt = (debtId: string) => {
    if (confirm('Are you sure you want to delete this debt?')) {
      const updatedDebts = debts.filter(debt => debt.id !== debtId)
      setDebts(updatedDebts)
      saveDebts(updatedDebts)
    }
  }

  const toggleDebtStatus = (debtId: string) => {
    const updatedDebts = debts.map(debt => 
      debt.id === debtId 
        ? { ...debt, isActive: !debt.isActive, updatedAt: new Date().toISOString() }
        : debt
    )
    setDebts(updatedDebts)
    saveDebts(updatedDebts)
  }

  const calculatePayoffTime = (balance: number, payment: number, rate: number): string => {
    if (payment <= 0 || rate < 0) return 'N/A'
    
    const monthlyRate = rate / 100 / 12
    if (monthlyRate === 0) {
      const months = Math.ceil(balance / payment)
      return `${Math.floor(months / 12)} years, ${months % 12} months`
    }
    
    const months = Math.ceil(-Math.log(1 - (balance * monthlyRate) / payment) / Math.log(1 + monthlyRate))
    if (isNaN(months) || months <= 0) return 'N/A'
    
    return `${Math.floor(months / 12)} years, ${months % 12} months`
  }

  const calculateTotalInterest = (balance: number, payment: number, rate: number): number => {
    if (payment <= 0 || rate < 0) return 0
    
    const monthlyRate = rate / 100 / 12
    if (monthlyRate === 0) return 0
    
    const months = Math.ceil(-Math.log(1 - (balance * monthlyRate) / payment) / Math.log(1 + monthlyRate))
    if (isNaN(months) || months <= 0) return 0
    
    return (payment * months) - balance
  }

  const totalDebtBalance = debts.filter(debt => debt.isActive).reduce((sum, debt) => sum + debt.currentBalance, 0)
  const totalMinimumPayments = debts.filter(debt => debt.isActive).reduce((sum, debt) => sum + debt.minimumPayment, 0)
  const debtPaymentPercentage = settings ? (totalMinimumPayments / settings.paycheckAmount) * 100 : 0

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
                <h1 className="text-3xl font-bold text-gray-900">Debt Tracking</h1>
              </div>
              <p className="text-gray-600 mt-1">
                Track your debts and plan your path to financial freedom
              </p>
            </div>
            <button 
              onClick={() => setShowAddForm(true)}
              className="btn-primary"
            >
              Add Debt
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Debt Summary */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Debt</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalDebtBalance)}</p>
              </div>
              <div className="text-3xl">💳</div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Min Payments</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalMinimumPayments)}</p>
              </div>
              <div className="text-3xl">📋</div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Payment %</p>
                <p className={`text-2xl font-bold ${debtPaymentPercentage > 30 ? 'text-red-600' : 'text-blue-600'}`}>
                  {formatPercentage(debtPaymentPercentage)}
                </p>
              </div>
              <div className="text-3xl">📊</div>
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Debts</p>
                <p className="text-2xl font-bold text-gray-900">{debts.filter(debt => debt.isActive).length}</p>
              </div>
              <div className="text-3xl">📈</div>
            </div>
          </div>
        </div>

        {/* Biblical Principle */}
        {settings.faithBasedMode && (
          <div className="bg-faith-50 border border-faith-200 rounded-lg p-6 mb-8">
            <div className="flex items-center">
              <div className="text-3xl mr-4">⚖️</div>
              <div>
                <h3 className="text-lg font-semibold text-faith-800">Biblical Debt Freedom</h3>
                <p className="text-faith-700">
                  "Let no debt remain outstanding, except the continuing debt to love one another" - Romans 13:8
                </p>
                <p className="text-sm text-faith-600 mt-2">
                  Plan your debt payoff strategy with wisdom and persistence. Freedom from debt brings peace and enables greater generosity.
                </p>
                <div className="mt-3 p-3 bg-orange-100 border border-orange-200 rounded-lg">
                  <p className="text-orange-800 text-sm font-medium">
                    💪 <strong>Remember:</strong> Every payment is progress. Temporary sacrifice leads to permanent freedom. 
                    Stay disciplined, stay focused, and celebrate each milestone on your journey to debt freedom.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Debt Payoff Strategies */}
        {debts.filter(d => d.isActive).length > 0 && (
          <div className="card mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">🎯 Debt Payoff Strategies</h2>
              <button 
                onClick={() => setShowStrategies(!showStrategies)}
                className="btn-secondary"
              >
                {showStrategies ? 'Hide Strategies' : 'Compare Strategies'}
              </button>
            </div>
            
            {showStrategies && (
              <div className="space-y-6">
                {/* Extra Payment Input */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-3">💡 Add Extra Payment Power</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="block text-sm text-green-700 mb-1">Extra monthly payment available:</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-gray-500">$</span>
                          <input
                            type="number"
                            className="input-field pl-8"
                            placeholder="0"
                            value={extraPayment || ''}
                            onChange={(e) => setExtraPayment(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                      <p className="text-sm text-green-700 mt-6">
                        Use excess funds from other accounts or budget cuts to accelerate payoff!
                      </p>
                    </div>
                    
                    {availableExcess > 0 && (
                      <div className="bg-blue-100 border border-blue-300 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-blue-800 font-semibold text-sm">💰 Available Excess Funds</p>
                            <p className="text-blue-700 text-xs">
                              Found {formatCurrency(availableExcess)} from low-utilization accounts
                            </p>
                          </div>
                          <button
                            onClick={() => setExtraPayment(Math.floor(availableExcess))}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                          >
                            Use {formatCurrency(Math.floor(availableExcess))}
                          </button>
                        </div>
                        <p className="text-blue-600 text-xs mt-2">
                          💡 This uses surplus from accounts with low bill utilization (keeping $500 buffer)
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Strategy Comparison */}
                {strategies.snowball && strategies.avalanche && (
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Debt Snowball */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-800 mb-3">❄️ Debt Snowball</h3>
                      <p className="text-sm text-blue-700 mb-3">Pay minimums on all debts, attack smallest balance first</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Total time:</span>
                          <span className="font-medium">{strategies.snowball.payoffTime} months</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total interest:</span>
                          <span className="font-medium">{formatCurrency(strategies.snowball.totalInterest)}</span>
                        </div>
                        <div className="mt-3 p-2 bg-blue-100 rounded">
                          <p className="text-xs text-blue-800">
                            <strong>Psychology:</strong> Quick wins build momentum and motivation
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Debt Avalanche */}
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h3 className="font-semibold text-purple-800 mb-3">🏔️ Debt Avalanche</h3>
                      <p className="text-sm text-purple-700 mb-3">Pay minimums on all debts, attack highest interest first</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Total time:</span>
                          <span className="font-medium">{strategies.avalanche.payoffTime} months</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total interest:</span>
                          <span className="font-medium">{formatCurrency(strategies.avalanche.totalInterest)}</span>
                        </div>
                        <div className="mt-3 p-2 bg-purple-100 rounded">
                          <p className="text-xs text-purple-800">
                            <strong>Math:</strong> Saves the most money in interest
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recommended Strategy */}
                {strategies.snowball && strategies.avalanche && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-semibold text-yellow-800 mb-2">🏆 Recommendation</h3>
                    <p className="text-sm text-yellow-700">
                      {strategies.avalanche.totalInterest < strategies.snowball.totalInterest ? (
                        <>
                          <strong>Debt Avalanche saves you {formatCurrency(strategies.snowball.totalInterest - strategies.avalanche.totalInterest)}</strong> compared to Snowball.
                          {Math.abs(strategies.avalanche.payoffTime - strategies.snowball.payoffTime) <= 3 ? 
                            " Both methods finish around the same time, so go with Avalanche for maximum savings!" :
                            " Choose based on your personality: Avalanche for math-minded savers, Snowball for motivation-driven people."
                          }
                        </>
                      ) : (
                        "Both strategies have similar costs. Choose Snowball for psychological wins or Avalanche for mathematical optimization."
                      )}
                    </p>
                  </div>
                )}
                
                {/* Debt Reduction Tips */}
                {reductionSuggestions.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">💡 Smart Expense Reduction Tips</h3>
                      <button 
                        onClick={() => setShowReductionTips(!showReductionTips)}
                        className="btn-secondary text-sm"
                      >
                        {showReductionTips ? 'Hide Tips' : 'Show Tips'}
                      </button>
                    </div>
                    
                    {showReductionTips && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <p className="text-orange-800 text-sm mb-4 font-medium">
                          🎯 <strong>Strategic Cost Cutting:</strong> Focus on what you can actually change. 
                          Some expenses are negotiable, others are not.
                        </p>
                        
                        <div className="space-y-4">
                          {reductionSuggestions.map((suggestion, index) => (
                            <div key={index} className={`border rounded-lg p-4 ${
                              suggestion.type === 'negotiable' ? 'bg-green-50 border-green-200' :
                              suggestion.type === 'lifestyle' ? 'bg-blue-50 border-blue-200' :
                              'bg-yellow-50 border-yellow-200'
                            }`}>
                              <div className="flex items-center justify-between mb-3">
                                <div>
                                  <h4 className={`font-semibold ${
                                    suggestion.type === 'negotiable' ? 'text-green-800' :
                                    suggestion.type === 'lifestyle' ? 'text-blue-800' :
                                    'text-yellow-800'
                                  }`}>
                                    {suggestion.type === 'negotiable' ? '✅' : 
                                     suggestion.type === 'lifestyle' ? '⚖️' : '⚠️'} {suggestion.category}
                                  </h4>
                                  <p className={`text-sm ${
                                    suggestion.type === 'negotiable' ? 'text-green-700' :
                                    suggestion.type === 'lifestyle' ? 'text-blue-700' :
                                    'text-yellow-700'
                                  }`}>
                                    Current: {formatCurrency(suggestion.totalAmount)}/month • 
                                    Potential savings: {formatCurrency(suggestion.potentialSavings)}/month
                                  </p>
                                </div>
                                <div className={`px-2 py-1 rounded text-xs font-medium ${
                                  suggestion.type === 'negotiable' ? 'bg-green-200 text-green-800' :
                                  suggestion.type === 'lifestyle' ? 'bg-blue-200 text-blue-800' :
                                  'bg-yellow-200 text-yellow-800'
                                }`}>
                                  {suggestion.type === 'negotiable' ? 'High Impact' :
                                   suggestion.type === 'lifestyle' ? 'Medium Impact' :
                                   'Optimize Only'}
                                </div>
                              </div>
                              
                              <div className="mb-3">
                                <p className={`text-xs font-medium mb-1 ${
                                  suggestion.type === 'negotiable' ? 'text-green-800' :
                                  suggestion.type === 'lifestyle' ? 'text-blue-800' :
                                  'text-yellow-800'
                                }`}>
                                  {suggestion.bills.length > 1 ? 'Affected bills:' : 'Bills:'} {suggestion.bills.join(', ')}
                                </p>
                              </div>
                              
                              <ul className={`text-xs space-y-1 ${
                                suggestion.type === 'negotiable' ? 'text-green-700' :
                                suggestion.type === 'lifestyle' ? 'text-blue-700' :
                                'text-yellow-700'
                              }`}>
                                {suggestion.suggestions.map((tip, tipIndex) => (
                                  <li key={tipIndex}>• {tip}</li>
                                ))}
                              </ul>
                              
                              {suggestion.potentialSavings > 50 && (
                                <div className="mt-3 p-2 bg-white bg-opacity-50 rounded border border-current border-opacity-20">
                                  <p className={`text-xs font-medium ${
                                    suggestion.type === 'negotiable' ? 'text-green-800' :
                                    suggestion.type === 'lifestyle' ? 'text-blue-800' :
                                    'text-yellow-800'
                                  }`}>
                                    💰 If you save {formatCurrency(suggestion.potentialSavings)}/month, 
                                    you could pay off debt {Math.round(suggestion.potentialSavings / 100)} months faster!
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        
                        <div className="mt-4 p-3 bg-orange-100 border border-orange-300 rounded-lg">
                          <p className="text-orange-800 text-sm font-medium">
                            💪 <strong>Remember:</strong> Temporary sacrifice leads to permanent freedom. 
                            Every dollar you free up accelerates your debt payoff and gets you closer to financial independence.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Debt List */}
        <div className="space-y-4">
          {debts.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-6xl mb-6">🎉</div>
              <h3 className="text-xl font-semibold mb-4">No Debts Tracked</h3>
              <p className="text-gray-600 mb-6">
                Great job! If you have debts to track, add them here to plan your payoff strategy.
              </p>
              <button onClick={() => setShowAddForm(true)} className="btn-primary">
                Add Debt to Track
              </button>
            </div>
          ) : (
            debts.map(debt => {
              const account = accounts.find(acc => acc.id === debt.accountId)
              const payoffTime = calculatePayoffTime(debt.currentBalance, debt.minimumPayment, debt.interestRate)
              const totalInterest = calculateTotalInterest(debt.currentBalance, debt.minimumPayment, debt.interestRate)
              
              return (
                <div key={debt.id} className={`card ${!debt.isActive ? 'opacity-60' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl">💳</div>
                      <div>
                        <h3 className="text-lg font-semibold">{debt.name}</h3>
                        <p className="text-gray-600">
                          {formatPercentage(debt.interestRate)} APR • Due: {new Date(debt.dueDate).toLocaleDateString()}
                        </p>
                        {account && (
                          <p className="text-sm text-gray-500">
                            Paid from: {account.nickname}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="grid grid-cols-3 gap-6">
                        <div>
                          <p className="text-sm text-gray-600">Balance</p>
                          <p className="text-xl font-bold text-red-600">{formatCurrency(debt.currentBalance)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Min Payment</p>
                          <p className="text-xl font-bold text-orange-600">{formatCurrency(debt.minimumPayment)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Payoff Time</p>
                          <p className="text-lg font-bold text-blue-600">{payoffTime}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 grid grid-cols-3 gap-6 text-sm">
                        <div>
                          <p className="text-gray-500">Total Interest</p>
                          <p className="font-medium text-red-600">{formatCurrency(totalInterest)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">% of Income</p>
                          <p className="font-medium">{formatPercentage((debt.minimumPayment / settings.paycheckAmount) * 100)}</p>
                        </div>
                        <div className="flex flex-col space-y-1">
                          <button
                            onClick={() => startEdit(debt)}
                            className="px-3 py-1 bg-blue-100 text-blue-800 hover:bg-blue-200 rounded text-xs font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => toggleDebtActive(debt.id)}
                            className={`px-3 py-1 rounded text-xs font-medium ${
                              debt.isActive 
                                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            }`}
                          >
                            {debt.isActive ? 'Active' : 'Inactive'}
                          </button>
                          <button
                            onClick={() => deleteDebt(debt.id)}
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

        {/* Debt Payoff Strategy */}
        {debts.length > 0 && (
          <div className="grid lg:grid-cols-2 gap-8 mt-8">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">💡 Debt Payoff Strategies</h3>
              <div className="space-y-4 text-sm">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-800">Debt Snowball Method</h4>
                  <p className="text-blue-700">Pay minimums on all debts, then attack the smallest balance first for psychological wins.</p>
                </div>
                
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-green-800">Debt Avalanche Method</h4>
                  <p className="text-green-700">Pay minimums on all debts, then attack the highest interest rate first to save money.</p>
                </div>
                
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h4 className="font-semibold text-purple-800">Extra Payment Impact</h4>
                  <p className="text-purple-700">Adding just $50-100 extra per month can cut years off your payoff time.</p>
                </div>
              </div>
            </div>
            
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">📊 Debt Health Check</h3>
              <div className="space-y-3">
                {debtPaymentPercentage > 40 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 font-medium">⚠️ High Debt Load</p>
                    <p className="text-red-700 text-sm">Debt payments exceed 40% of income. Consider debt consolidation or additional income.</p>
                  </div>
                )}
                
                {debtPaymentPercentage > 20 && debtPaymentPercentage <= 40 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 font-medium">⚡ Manageable but High</p>
                    <p className="text-yellow-700 text-sm">Focus on aggressive payoff strategy to free up income.</p>
                  </div>
                )}
                
                {debtPaymentPercentage <= 20 && debtPaymentPercentage > 0 && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 font-medium">✅ Healthy Debt Level</p>
                    <p className="text-green-700 text-sm">Good debt-to-income ratio. Consider extra payments to accelerate freedom.</p>
                  </div>
                )}
                
                <div className="text-sm text-gray-600">
                  <p className="font-medium">Recommendations:</p>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>Keep debt payments under 20% of income</li>
                    <li>Pay more than minimums when possible</li>
                    <li>Avoid taking on new debt</li>
                    <li>Build emergency fund while paying off debt</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Debt Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">{editingDebt ? 'Edit Debt' : 'Add Debt to Track'}</h2>
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
                      <label className="label">Debt Name *</label>
                      <input
                        {...register('name', { required: 'Debt name is required' })}
                        className="input-field"
                        placeholder="Credit Card, Student Loan, Car Loan..."
                      />
                      {errors.name && (
                        <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="label">Current Balance *</label>
                      <div className="flex items-center">
                        <span className="text-gray-500 mr-2">$</span>
                        <input
                          {...register('currentBalance', { 
                            required: 'Balance is required',
                            min: { value: 0.01, message: 'Must be greater than 0' }
                          })}
                          type="number"
                          step="0.01"
                          className="input-field"
                          placeholder="5000.00"
                        />
                      </div>
                      {errors.currentBalance && (
                        <p className="text-red-600 text-sm mt-1">{errors.currentBalance.message}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="label">Minimum Payment *</label>
                      <div className="flex items-center">
                        <span className="text-gray-500 mr-2">$</span>
                        <input
                          {...register('minimumPayment', { 
                            required: 'Minimum payment is required',
                            min: { value: 0.01, message: 'Must be greater than 0' }
                          })}
                          type="number"
                          step="0.01"
                          className="input-field"
                          placeholder="150.00"
                        />
                      </div>
                      {watchedPayment && settings && (
                        <p className="text-sm text-blue-600 mt-1">
                          {formatPercentage((watchedPayment / settings.paycheckAmount) * 100)} of your paycheck
                        </p>
                      )}
                      {errors.minimumPayment && (
                        <p className="text-red-600 text-sm mt-1">{errors.minimumPayment.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="label">Interest Rate (APR) *</label>
                      <div className="flex items-center">
                        <input
                          {...register('interestRate', { 
                            required: 'Interest rate is required',
                            min: { value: 0, message: 'Must be 0 or greater' },
                            max: { value: 50, message: 'Must be less than 50%' }
                          })}
                          type="number"
                          step="0.01"
                          className="input-field"
                          placeholder="18.99"
                        />
                        <span className="ml-2 text-gray-500">%</span>
                      </div>
                      {errors.interestRate && (
                        <p className="text-red-600 text-sm mt-1">{errors.interestRate.message}</p>
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
                  
                  {/* Payoff Preview */}
                  {watchedBalance && watchedPayment && watchedRate && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-2">Payoff Preview</h4>
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-blue-700">
                            <span className="font-medium">Payoff Time:</span> {calculatePayoffTime(watchedBalance, watchedPayment, watchedRate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-blue-700">
                            <span className="font-medium">Total Interest:</span> {formatCurrency(calculateTotalInterest(watchedBalance, watchedPayment, watchedRate))}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-4 pt-6">
                    <button 
                      type="button" 
                      onClick={() => setShowAddForm(false)}
                      className="btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary flex-1">
{editingDebt ? 'Update Debt' : 'Add Debt'}
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