'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Navigation from'@/components/Navigation'
import { useForm } from 'react-hook-form'
import { SavingsGoal, Account, StewardshipSettings } from '@/types'
import { getSavingsGoals, saveSavingsGoals, getAccounts, getSettingsFromStorage } from '@/utils/storage'
import { generateGoalId, formatCurrency, formatPercentage, calculateGoalProgress } from '@/utils/calculations'

interface GoalFormData {
  name: string
  type: 'emergency' | 'house' | 'vacation' | 'wedding' | 'car' | 'education' | 'retirement' | 'custom'
  targetAmount: number
  currentAmount: number
  targetDate: string
  monthlyContribution: number
  accountId: string
  priority: number
  description: string
}

const GOAL_TYPES = [
  { value: 'emergency', label: 'Emergency Fund', icon: '🛡️', description: '3-6 months of expenses' },
  { value: 'house', label: 'House Fund', icon: '🏠', description: 'Down payment or home purchase' },
  { value: 'vacation', label: 'Vacation', icon: '✈️', description: 'Travel and vacation fund' },
  { value: 'wedding', label: 'Wedding', icon: '💒', description: 'Wedding expenses' },
  { value: 'car', label: 'Car Fund', icon: '🚗', description: 'Vehicle purchase or replacement' },
  { value: 'education', label: 'Education', icon: '🎓', description: 'College or training costs' },
  { value: 'retirement', label: 'Retirement', icon: '🌅', description: 'Long-term retirement savings' },
  { value: 'custom', label: 'Custom Goal', icon: '🎯', description: 'Your custom savings goal' }
]

export default function GoalsPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [settings, setSettings] = useState<StewardshipSettings | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null)
  
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<GoalFormData>()
  
  const watchedType = watch('type')
  const watchedTarget = watch('targetAmount')
  const watchedCurrent = watch('currentAmount')
  const watchedDate = watch('targetDate')
  const watchedContribution = watch('monthlyContribution')

  useEffect(() => {
    const loadedGoals = getSavingsGoals()
    const loadedAccounts = getAccounts()
    const loadedSettings = getSettingsFromStorage()
    setGoals(loadedGoals)
    setAccounts(loadedAccounts)
    setSettings(loadedSettings)
  }, [])

  const onSubmit = (data: GoalFormData) => {
    if (editingGoal) {
      // Update existing goal
      const updatedGoal: SavingsGoal = {
        ...editingGoal,
        name: data.name,
        type: data.type,
        targetAmount: data.targetAmount,
        currentAmount: data.currentAmount,
        targetDate: data.targetDate,
        monthlyContribution: data.monthlyContribution,
        accountId: data.accountId,
        priority: data.priority,
        description: data.description,
        updatedAt: new Date().toISOString()
      }
      
      const updatedGoals = goals.map(goal => 
        goal.id === editingGoal.id ? updatedGoal : goal
      )
      setGoals(updatedGoals)
      saveSavingsGoals(updatedGoals)
      setEditingGoal(null)
    } else {
      // Create new goal
      const newGoal: SavingsGoal = {
        id: generateGoalId(),
        name: data.name,
        type: data.type,
        targetAmount: data.targetAmount,
        currentAmount: data.currentAmount || 0,
        targetDate: data.targetDate,
        monthlyContribution: data.monthlyContribution,
        accountId: data.accountId,
        priority: data.priority,
        isActive: true,
        description: data.description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      const updatedGoals = [...goals, newGoal]
      setGoals(updatedGoals)
      saveSavingsGoals(updatedGoals)
    }
    
    reset()
    setShowAddForm(false)
  }

  const startEdit = (goal: SavingsGoal) => {
    setEditingGoal(goal)
    setShowAddForm(true)
    reset({
      name: goal.name,
      type: goal.type,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      targetDate: goal.targetDate,
      monthlyContribution: goal.monthlyContribution,
      accountId: goal.accountId,
      priority: goal.priority,
      description: goal.description
    })
  }

  const deleteGoal = (goalId: string) => {
    if (confirm('Are you sure you want to delete this goal?')) {
      const updatedGoals = goals.filter(goal => goal.id !== goalId)
      setGoals(updatedGoals)
      saveSavingsGoals(updatedGoals)
    }
  }

  const toggleGoalActive = (goalId: string) => {
    const updatedGoals = goals.map(goal =>
      goal.id === goalId ? { ...goal, isActive: !goal.isActive, updatedAt: new Date().toISOString() } : goal
    )
    setGoals(updatedGoals)
    saveSavingsGoals(updatedGoals)
  }

  const updateGoalProgress = (goalId: string, newAmount: number) => {
    const updatedGoals = goals.map(goal =>
      goal.id === goalId ? { ...goal, currentAmount: newAmount, updatedAt: new Date().toISOString() } : goal
    )
    setGoals(updatedGoals)
    saveSavingsGoals(updatedGoals)
  }

  const getGoalTypeInfo = (type: string) => {
    return GOAL_TYPES.find(t => t.value === type) || GOAL_TYPES[GOAL_TYPES.length - 1]
  }

  const calculateProjectedCompletion = () => {
    if (!watchedTarget || !watchedCurrent || !watchedContribution) return null
    
    const remaining = watchedTarget - watchedCurrent
    if (remaining <= 0) return "Goal already achieved!"
    
    const monthsToComplete = Math.ceil(remaining / watchedContribution)
    const completionDate = new Date()
    completionDate.setMonth(completionDate.getMonth() + monthsToComplete)
    
    return `${monthsToComplete} months (${completionDate.toLocaleDateString()})`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Savings Goals</h1>
              <p className="text-gray-600 mt-1">Track your financial aspirations and milestones</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/calendar" className="btn-secondary">
                View Calendar
              </Link>
              <button 
                onClick={() => setShowAddForm(true)}
                className="btn-primary"
              >
                Add Goal
              </button>
              <Navigation />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Goals Overview */}
        {goals.length > 0 && (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="card">
              <h3 className="text-lg font-semibold mb-2">🎯 Active Goals</h3>
              <p className="text-3xl font-bold text-blue-600">{goals.filter(g => g.isActive).length}</p>
            </div>
            <div className="card">
              <h3 className="text-lg font-semibold mb-2">💰 Total Target</h3>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(goals.reduce((sum, goal) => sum + goal.targetAmount, 0))}
              </p>
            </div>
            <div className="card">
              <h3 className="text-lg font-semibold mb-2">📈 Total Saved</h3>
              <p className="text-3xl font-bold text-purple-600">
                {formatCurrency(goals.reduce((sum, goal) => sum + goal.currentAmount, 0))}
              </p>
            </div>
          </div>
        )}

        {/* Goals List */}
        <div className="space-y-6">
          {goals.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-6xl mb-6">🎯</div>
              <h3 className="text-xl font-semibold mb-4">No Goals Set</h3>
              <p className="text-gray-600 mb-6">
                Create savings goals to track your financial aspirations and stay motivated
              </p>
              <button onClick={() => setShowAddForm(true)} className="btn-primary">
                Create Your First Goal
              </button>
            </div>
          ) : (
            goals.map(goal => {
              const typeInfo = getGoalTypeInfo(goal.type)
              const progress = calculateGoalProgress(goal)
              const linkedAccount = accounts.find(acc => acc.id === goal.accountId)
              
              return (
                <div key={goal.id} className={`card ${!goal.isActive ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="text-4xl">{typeInfo.icon}</div>
                      <div>
                        <h3 className="text-xl font-semibold">{goal.name}</h3>
                        <p className="text-gray-600">{goal.description || typeInfo.description}</p>
                        {linkedAccount && (
                          <p className="text-sm text-blue-600">Linked to: {linkedAccount.nickname}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => startEdit(goal)}
                        className="btn-secondary text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleGoalActive(goal.id)}
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          goal.isActive 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {goal.isActive ? 'Active' : 'Paused'}
                      </button>
                      <button
                        onClick={() => deleteGoal(goal.id)}
                        className="px-3 py-1 bg-red-100 text-red-800 hover:bg-red-200 rounded text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Progress Section */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        {formatCurrency(goal.currentAmount)} of {formatCurrency(goal.targetAmount)}
                      </span>
                      <span className={`text-sm font-medium ${
                        progress.onTrack ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatPercentage(progress.progressPercentage)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          progress.progressPercentage >= 100 ? 'bg-green-500' :
                          progress.onTrack ? 'bg-blue-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(progress.progressPercentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Goal Details */}
                  <div className="grid md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Target Date</p>
                      <p className="font-medium">{new Date(goal.targetDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Monthly Contribution</p>
                      <p className="font-medium">{formatCurrency(goal.monthlyContribution)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Months Remaining</p>
                      <p className="font-medium">{progress.monthsRemaining} months</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Status</p>
                      <p className={`font-medium ${
                        progress.progressPercentage >= 100 ? 'text-green-600' :
                        progress.onTrack ? 'text-blue-600' : 'text-red-600'
                      }`}>
                        {progress.progressPercentage >= 100 ? 'Completed!' :
                         progress.onTrack ? 'On Track' : 'Behind Schedule'}
                      </p>
                    </div>
                  </div>

                  {/* Quick Update */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600">Update progress:</span>
                      <input
                        type="number"
                        className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="New amount"
                        onBlur={(e) => {
                          const value = parseFloat(e.target.value)
                          if (value >= 0) {
                            updateGoalProgress(goal.id, value)
                            e.target.value = ''
                          }
                        }}
                      />
                      <span className="text-sm text-gray-600">
                        Need {formatCurrency(Math.max(0, (goal.targetAmount - goal.currentAmount) / progress.monthsRemaining))} per month to stay on track
                      </span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Add/Edit Goal Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">{editingGoal ? 'Edit Goal' : 'Create New Goal'}</h2>
                  <button 
                    onClick={() => {
                      setShowAddForm(false)
                      setEditingGoal(null)
                      reset()
                    }}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Goal Type */}
                  <div>
                    <label className="label">Goal Type</label>
                    <select {...register('type', { required: 'Goal type is required' })} className="input-field">
                      {GOAL_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </option>
                      ))}
                    </select>
                    {errors.type && <p className="error-message">{errors.type.message}</p>}
                  </div>

                  {/* Goal Name */}
                  <div>
                    <label className="label">Goal Name</label>
                    <input
                      {...register('name', { required: 'Goal name is required' })}
                      className="input-field"
                      placeholder={watchedType ? getGoalTypeInfo(watchedType).label : 'Enter goal name'}
                    />
                    {errors.name && <p className="error-message">{errors.name.message}</p>}
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Target Amount */}
                    <div>
                      <label className="label">Target Amount</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">$</span>
                        <input
                          type="number"
                          {...register('targetAmount', { required: 'Target amount is required', min: 1 })}
                          className="input-field pl-8"
                          placeholder="10000"
                        />
                      </div>
                      {errors.targetAmount && <p className="error-message">{errors.targetAmount.message}</p>}
                    </div>

                    {/* Current Amount */}
                    <div>
                      <label className="label">Current Amount</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">$</span>
                        <input
                          type="number"
                          {...register('currentAmount', { min: 0 })}
                          className="input-field pl-8"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Target Date */}
                    <div>
                      <label className="label">Target Date</label>
                      <input
                        type="date"
                        {...register('targetDate', { required: 'Target date is required' })}
                        className="input-field"
                        min={new Date().toISOString().split('T')[0]}
                      />
                      {errors.targetDate && <p className="error-message">{errors.targetDate.message}</p>}
                    </div>

                    {/* Monthly Contribution */}
                    <div>
                      <label className="label">Monthly Contribution</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">$</span>
                        <input
                          type="number"
                          {...register('monthlyContribution', { required: 'Monthly contribution is required', min: 1 })}
                          className="input-field pl-8"
                          placeholder="500"
                        />
                      </div>
                      {errors.monthlyContribution && <p className="error-message">{errors.monthlyContribution.message}</p>}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Linked Account */}
                    <div>
                      <label className="label">Linked Account (Optional)</label>
                      <select {...register('accountId')} className="input-field">
                        <option value="">No specific account</option>
                        {accounts.filter(acc => acc.isActive).map(account => (
                          <option key={account.id} value={account.id}>
                            {account.nickname} ({account.bankName})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Priority */}
                    <div>
                      <label className="label">Priority (1=Highest)</label>
                      <select {...register('priority', { valueAsNumber: true })} className="input-field">
                        <option value={1}>1 - Highest Priority</option>
                        <option value={2}>2 - High Priority</option>
                        <option value={3}>3 - Medium Priority</option>
                        <option value={4}>4 - Low Priority</option>
                        <option value={5}>5 - Lowest Priority</option>
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="label">Description (Optional)</label>
                    <textarea
                      {...register('description')}
                      className="input-field"
                      rows={3}
                      placeholder="Additional details about this goal..."
                    />
                  </div>

                  {/* Projection */}
                  {watchedTarget && watchedContribution && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-2">📊 Goal Projection</h4>
                      <p className="text-blue-700 text-sm">
                        At {formatCurrency(watchedContribution)}/month, you'll reach your goal in: <strong>{calculateProjectedCompletion()}</strong>
                      </p>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false)
                        setEditingGoal(null)
                        reset()
                      }}
                      className="btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary flex-1">
                      {editingGoal ? 'Update Goal' : 'Create Goal'}
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
