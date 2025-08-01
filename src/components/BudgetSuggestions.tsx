'use client'

import { useState } from 'react'
import { Account, AccountCategory, StewardshipSettings } from '@/types'
import { generateAccountId, formatCurrency, formatPercentage, getBudgetRecommendations } from '@/utils/calculations'

interface BudgetSuggestionsProps {
  remainingPercentage: number
  paycheckAmount: number
  accounts: Account[]
  totalAllocated: number
  onAddAccount: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => void
  onClose: () => void
}

const SUGGESTIONS = [
  {
    name: 'Emergency Fund',
    category: 'savings' as AccountCategory,
    suggestedPercentage: 5,
    description: 'Build 3-6 months of expenses for unexpected situations',
    icon: '🛡️',
    priority: 1
  },
  {
    name: 'Debt Payments',
    category: 'debt' as AccountCategory,
    suggestedPercentage: 10,
    description: 'Extra debt payments to accelerate freedom',
    icon: '💳',
    priority: 2
  },
  {
    name: 'House Fund',
    category: 'savings' as AccountCategory,
    suggestedPercentage: 10,
    description: 'Down payment or home improvement savings',
    icon: '🏠',
    priority: 3
  },
  {
    name: 'Car Replacement',
    category: 'savings' as AccountCategory,
    suggestedPercentage: 5,
    description: 'Save for your next vehicle purchase',
    icon: '🚗',
    priority: 4
  },
  {
    name: 'Vacation Fund',
    category: 'savings' as AccountCategory,
    suggestedPercentage: 3,
    description: 'Guilt-free vacation and recreation money',
    icon: '✈️',
    priority: 5
  },
  {
    name: 'Fun Money',
    category: 'expenses' as AccountCategory,
    suggestedPercentage: 5,
    description: 'Discretionary spending for entertainment',
    icon: '🎉',
    priority: 6
  },
  {
    name: 'Available Spending',
    category: 'expenses' as AccountCategory,
    suggestedPercentage: 0, // Will use remaining
    description: 'Flexible money for whatever comes up',
    icon: '💰',
    priority: 7
  }
]

export default function BudgetSuggestions({ 
  remainingPercentage, 
  paycheckAmount, 
  accounts,
  totalAllocated,
  onAddAccount, 
  onClose 
}: BudgetSuggestionsProps) {
  const [customPercentages, setCustomPercentages] = useState<Record<string, number>>({})
  
  const remainingAmount = (paycheckAmount * remainingPercentage) / 100
  const recommendations = getBudgetRecommendations(accounts, totalAllocated)

  const getAdjustedPercentage = (suggestion: typeof SUGGESTIONS[0]) => {
    if (suggestion.name === 'Available Spending') {
      return remainingPercentage
    }
    
    const customValue = customPercentages[suggestion.name]
    if (customValue !== undefined) {
      return customValue
    }
    
    return Math.min(suggestion.suggestedPercentage, remainingPercentage)
  }

  const handleAddAccount = (suggestion: typeof SUGGESTIONS[0]) => {
    const percentage = getAdjustedPercentage(suggestion)
    
    if (percentage <= 0) return
    
    const account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'> = {
      nickname: suggestion.name,
      bankName: 'Your Bank',
      accountType: suggestion.category === 'savings' ? 'savings' : 'checking',
      accountNumber: '0000',
      currentBalance: 0,
      payrollPercentage: percentage,
      category: suggestion.category,
      isActive: true
    }
    
    onAddAccount(account)
  }

  const updateCustomPercentage = (suggestionName: string, value: number) => {
    setCustomPercentages(prev => ({
      ...prev,
      [suggestionName]: Math.max(0, Math.min(value, remainingPercentage))
    }))
  }

  const filteredSuggestions = SUGGESTIONS.filter(s => 
    s.name === 'Available Spending' || s.suggestedPercentage <= remainingPercentage
  ).sort((a, b) => a.priority - b.priority)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">💡 Complete Your Budget</h2>
              <p className="text-gray-600">
                You have {formatPercentage(remainingPercentage)} ({formatCurrency(remainingAmount)}) unallocated
              </p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Smart Recommendations */}
          {recommendations.length > 0 && (
            <div className="mb-6 space-y-3">
              {recommendations.map((rec, index) => (
                <div key={index} className={`p-4 rounded-lg border ${
                  rec.type === 'error' ? 'bg-red-50 border-red-200' :
                  rec.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-blue-50 border-blue-200'
                }`}>
                  <div className="flex items-start">
                    <div className="text-2xl mr-3">
                      {rec.type === 'error' ? '🚨' : rec.type === 'warning' ? '⚠️' : '💡'}
                    </div>
                    <div className="flex-1">
                      <p className={`font-semibold ${
                        rec.type === 'error' ? 'text-red-800' :
                        rec.type === 'warning' ? 'text-yellow-800' :
                        'text-blue-800'
                      }`}>
                        {rec.type === 'error' ? 'Budget Issue' : 
                         rec.type === 'warning' ? 'Caution' : 'Suggestion'}
                      </p>
                      <p className={`text-sm ${
                        rec.type === 'error' ? 'text-red-700' :
                        rec.type === 'warning' ? 'text-yellow-700' :
                        'text-blue-700'
                      }`}>
                        {rec.message}
                      </p>
                      {rec.action && (
                        <p className={`text-xs mt-1 font-medium ${
                          rec.type === 'error' ? 'text-red-800' :
                          rec.type === 'warning' ? 'text-yellow-800' :
                          'text-blue-800'
                        }`}>
                          💡 {rec.action}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">💰 Smart Budget Completion</h3>
            <p className="text-blue-700 text-sm">
              Every dollar should have a purpose! These suggestions help you allocate your remaining 
              {formatPercentage(remainingPercentage)} to complete your 100% budget.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            {filteredSuggestions.map((suggestion, index) => {
              const adjustedPercentage = getAdjustedPercentage(suggestion)
              const amount = (paycheckAmount * adjustedPercentage) / 100
              
              return (
                <div 
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{suggestion.icon}</span>
                      <div>
                        <h3 className="font-semibold">{suggestion.name}</h3>
                        <p className="text-sm text-gray-600">{suggestion.description}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        min="0"
                        max={remainingPercentage}
                        step="0.5"
                        value={adjustedPercentage}
                        onChange={(e) => updateCustomPercentage(suggestion.name, parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                        disabled={suggestion.name === 'Available Spending'}
                      />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary-600">
                        {formatCurrency(amount)}
                      </p>
                      <p className="text-xs text-gray-500">per paycheck</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleAddAccount(suggestion)}
                    disabled={adjustedPercentage <= 0}
                    className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add {suggestion.name} Account
                  </button>
                </div>
              )
            })}
          </div>
          
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-2xl mr-3">🎯</span>
              <div>
                <h4 className="font-semibold text-green-800">Complete Budget Goal</h4>
                <p className="text-green-700 text-sm">
                  Add accounts until you reach 100% allocation. Every dollar will have a purpose 
                  and your payroll distribution will be complete!
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4 pt-6">
            <button 
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              I'll Add Later
            </button>
            <button 
              onClick={() => handleAddAccount(SUGGESTIONS.find(s => s.name === 'Available Spending')!)}
              className="btn-primary flex-1"
            >
              Just Add "Available Spending" ({formatPercentage(remainingPercentage)})
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}