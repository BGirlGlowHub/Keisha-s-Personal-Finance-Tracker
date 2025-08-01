'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StewardshipSettings } from '@/types'
import { saveSettingsToStorage } from '@/utils/storage'
import { formatCurrency } from '@/utils/calculations'

const SETUP_STEPS = {
  APPROACH: 'approach',
  INCOME: 'income',
  PAYFREQUENCY: 'payfrequency',
  TITHING: 'tithing',
  SAVINGS: 'savings',
  POCKET_MONEY: 'pocket_money',
  COMPLETE: 'complete'
} as const

type SetupStep = typeof SETUP_STEPS[keyof typeof SETUP_STEPS]

export default function SetupPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<SetupStep>(SETUP_STEPS.APPROACH)
  const [settings, setSettings] = useState<StewardshipSettings>({
    faithBasedMode: true,
    tithingEnabled: true,
    tithingPercentage: 10,
    emergencyFundPercentage: 5,
    pocketMoneyPercentage: 0,
    paycheckAmount: 0,
    payFrequency: 'bi-weekly',
    nextPayDate: '',
    payDates: []
  })

  const updateSettings = (updates: Partial<StewardshipSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }))
  }

  const nextStep = () => {
    switch (currentStep) {
      case SETUP_STEPS.APPROACH:
        setCurrentStep(SETUP_STEPS.INCOME)
        break
      case SETUP_STEPS.INCOME:
        setCurrentStep(SETUP_STEPS.PAYFREQUENCY)
        break
      case SETUP_STEPS.PAYFREQUENCY:
        setCurrentStep(settings.tithingEnabled ? SETUP_STEPS.TITHING : SETUP_STEPS.SAVINGS)
        break
      case SETUP_STEPS.TITHING:
        setCurrentStep(SETUP_STEPS.SAVINGS)
        break
      case SETUP_STEPS.SAVINGS:
        setCurrentStep(SETUP_STEPS.POCKET_MONEY)
        break
      case SETUP_STEPS.POCKET_MONEY:
        setCurrentStep(SETUP_STEPS.COMPLETE)
        break
      case SETUP_STEPS.COMPLETE:
        saveSettingsToStorage(settings)
        router.push('/dashboard')
        break
    }
  }

  const prevStep = () => {
    switch (currentStep) {
      case SETUP_STEPS.INCOME:
        setCurrentStep(SETUP_STEPS.APPROACH)
        break
      case SETUP_STEPS.PAYFREQUENCY:
        setCurrentStep(SETUP_STEPS.INCOME)
        break
      case SETUP_STEPS.TITHING:
        setCurrentStep(SETUP_STEPS.PAYFREQUENCY)
        break
      case SETUP_STEPS.SAVINGS:
        setCurrentStep(settings.tithingEnabled ? SETUP_STEPS.TITHING : SETUP_STEPS.PAYFREQUENCY)
        break
      case SETUP_STEPS.POCKET_MONEY:
        setCurrentStep(SETUP_STEPS.SAVINGS)
        break
      case SETUP_STEPS.COMPLETE:
        setCurrentStep(SETUP_STEPS.POCKET_MONEY)
        break
    }
  }

  const renderApproachStep = () => (
    <div className="max-w-2xl mx-auto text-center">
      <h2 className="text-3xl font-bold mb-6">Choose Your Financial Approach</h2>
      <p className="text-gray-600 mb-8">
        Select the approach that aligns with your values and beliefs. You can change this later.
      </p>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div 
          className={`card cursor-pointer transition-all border-2 ${
            settings.faithBasedMode ? 'border-faith-500 bg-faith-50' : 'border-gray-200 hover:border-faith-300'
          }`}
          onClick={() => updateSettings({ faithBasedMode: true, tithingEnabled: true })}
        >
          <div className="text-4xl mb-4">🙏</div>
          <h3 className="text-xl font-semibold mb-3 text-faith-700">Faith-Based Stewardship</h3>
          <p className="text-gray-600 mb-4">
            Honor God first with tithing, then pay yourself, then cover bills
          </p>
          <div className="text-sm text-faith-600 space-y-1">
            <p>✓ Tithing first (10% default)</p>
            <p>✓ Emergency fund second</p>
            <p>✓ Bills covered automatically</p>
            <p>✓ Biblical financial order</p>
          </div>
        </div>
        
        <div 
          className={`card cursor-pointer transition-all border-2 ${
            !settings.faithBasedMode ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300'
          }`}
          onClick={() => updateSettings({ faithBasedMode: false, tithingEnabled: false })}
        >
          <div className="text-4xl mb-4">💰</div>
          <h3 className="text-xl font-semibold mb-3 text-primary-700">Secular Approach</h3>
          <p className="text-gray-600 mb-4">
            Pay yourself first, then cover bills and obligations
          </p>
          <div className="text-sm text-primary-600 space-y-1">
            <p>✓ Savings and emergency fund first</p>
            <p>✓ Bills covered automatically</p>
            <p>✓ Traditional financial order</p>
            <p>✓ Focus on wealth building</p>
          </div>
        </div>
      </div>
      
      <button 
        onClick={nextStep}
        className={settings.faithBasedMode ? 'btn-faith mt-8' : 'btn-primary mt-8'}
      >
        Continue with {settings.faithBasedMode ? 'Faith-Based' : 'Secular'} Approach
      </button>
    </div>
  )

  const renderIncomeStep = () => (
    <div className="max-w-xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-6">Enter Your Net Paycheck</h2>
      <p className="text-gray-600 text-center mb-8">
        Enter your take-home pay PER PAYCHECK (after taxes and deductions). This will be used to calculate percentages for each individual paycheck.
      </p>
      
      <div className="card">
        <label className="label">Net Paycheck Amount (Take-home pay per paycheck)</label>
        <div className="relative">
          <span className="absolute left-3 top-2 text-gray-500">$</span>
          <input
            type="number"
            className="input-field pl-8"
            placeholder="1,750"
            value={settings.paycheckAmount || ''}
            onChange={(e) => updateSettings({ paycheckAmount: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">
          <strong>Important:</strong> Enter your individual paycheck amount, not monthly income
        </p>
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-sm font-medium mb-2">💡 Examples:</p>
          <ul className="text-blue-700 text-xs space-y-1">
            <li>• Bi-weekly (every 2 weeks): $1,750 per paycheck</li>
            <li>• Weekly: $875 per paycheck</li>
            <li>• Monthly: $3,500 per paycheck</li>
            <li>• Semi-monthly (twice/month): $1,750 per paycheck</li>
          </ul>
        </div>
      </div>
      
      <div className="flex gap-4 mt-8">
        <button onClick={prevStep} className="btn-secondary flex-1">
          Back
        </button>
        <button 
          onClick={nextStep}
          disabled={settings.paycheckAmount <= 0}
          className={`flex-1 ${settings.faithBasedMode ? 'btn-faith' : 'btn-primary'} disabled:opacity-50`}
        >
          Continue
        </button>
      </div>
    </div>
  )

  const renderTithingStep = () => (
    <div className="max-w-xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-6">Set Your Tithing Amount</h2>
      <p className="text-gray-600 text-center mb-8">
        "Honor the Lord with your wealth, with the firstfruits of all your crops" - Proverbs 3:9
      </p>
      
      <div className="card">
        <label className="label">Tithing Percentage</label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="20"
            step="0.5"
            value={settings.tithingPercentage}
            onChange={(e) => updateSettings({ tithingPercentage: parseFloat(e.target.value) })}
            className="flex-1"
          />
          <div className="text-right min-w-[80px]">
            <div className="text-lg font-semibold">{settings.tithingPercentage}%</div>
            <div className="text-sm text-gray-500">
              ${((settings.paycheckAmount * settings.tithingPercentage) / 100).toFixed(0)}
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-faith-50 rounded-lg">
          <h4 className="font-semibold text-faith-800 mb-2">Biblical Foundation</h4>
          <p className="text-sm text-faith-700">
            The Bible speaks of tithing (10%) as returning to God what is already His. 
            This percentage ensures your giving comes first, establishing faithful stewardship.
          </p>
        </div>
      </div>
      
      <div className="flex gap-4 mt-8">
        <button onClick={prevStep} className="btn-secondary flex-1">
          Back
        </button>
        <button onClick={nextStep} className="btn-faith flex-1">
          Continue
        </button>
      </div>
    </div>
  )

  const generatePayDates = (frequency: string, startDate: string) => {
    const dates = []
    const start = new Date(startDate + 'T00:00:00')
    for (let i = 0; i < 12; i++) {
      let payDate
      switch (frequency) {
        case 'weekly':
          payDate = new Date(start)
          payDate.setDate(start.getDate() + (i * 7))
          break
        case 'bi-weekly':
          payDate = new Date(start)
          payDate.setDate(start.getDate() + (i * 14))
          break
        case 'semi-monthly':
          payDate = new Date(start.getFullYear(), start.getMonth(), 1)
          if (i % 2 === 0) {
            payDate.setMonth(start.getMonth() + Math.floor(i / 2))
            payDate.setDate(1)
          } else {
            payDate.setMonth(start.getMonth() + Math.floor(i / 2))
            payDate.setDate(15)
          }
          break
        case 'monthly':
          payDate = new Date(start)
          payDate.setMonth(start.getMonth() + i)
          break
        default:
          payDate = new Date(start)
      }
      const year = payDate.getFullYear()
      const month = String(payDate.getMonth() + 1).padStart(2, '0')
      const day = String(payDate.getDate()).padStart(2, '0')
      const formattedDate = `${year}-${month}-${day}`
      dates.push(formattedDate)
    }
    return dates
  }

  const renderPayFrequencyStep = () => (
    <div className="max-w-xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-6">Set Your Pay Schedule</h2>
      <p className="text-gray-600 text-center mb-8">
        Tell us when you get paid so we can track your bills and cash flow perfectly.
      </p>
      
      <div className="card space-y-6">
        <div>
          <label className="label">How often do you get paid?</label>
          <select 
            value={settings.payFrequency}
            onChange={(e) => updateSettings({ payFrequency: e.target.value as any })}
            className="input-field"
          >
            <option value="weekly">Weekly (52 times/year)</option>
            <option value="bi-weekly">Bi-weekly / Every 2 weeks (26 times/year)</option>
            <option value="semi-monthly">Semi-monthly / Twice per month (24 times/year)</option>
            <option value="monthly">Monthly (12 times/year)</option>
          </select>
        </div>
        
        <div>
          <label className="label">When is your next payday?</label>
          <input
            type="date"
            value={settings.nextPayDate}
            onChange={(e) => {
              const nextPayDate = e.target.value
              const payDates = generatePayDates(settings.payFrequency, nextPayDate)
              updateSettings({ nextPayDate, payDates })
            }}
            className="input-field"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
        
        {settings.nextPayDate && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">📅 Your Pay Schedule Preview</h4>
            <div className="text-sm text-green-700">
              <p className="mb-2">
                <strong>{settings.payFrequency === 'bi-weekly' ? 'Bi-weekly' : 
                        settings.payFrequency === 'semi-monthly' ? 'Semi-monthly' :
                        settings.payFrequency.charAt(0).toUpperCase() + settings.payFrequency.slice(1)}</strong> payments of <strong>{formatCurrency(settings.paycheckAmount)}</strong>
              </p>
              <p className="font-medium mb-1">Next few pay dates:</p>
              <ul className="grid grid-cols-2 gap-1 text-xs">
                {settings.payDates.slice(0, 6).map((date, index) => (
                  <li key={index}>• {new Date(date + 'T00:00:00').toLocaleDateString()}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex gap-4 mt-8">
        <button onClick={prevStep} className="btn-secondary flex-1">
          Back
        </button>
        <button 
          onClick={nextStep}
          disabled={!settings.nextPayDate}
          className={`flex-1 ${settings.faithBasedMode ? 'btn-faith' : 'btn-primary'} disabled:opacity-50`}
        >
          Continue
        </button>
      </div>
    </div>
  )

  const renderSavingsStep = () => (
    <div className="max-w-xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-6">
        {settings.faithBasedMode ? 'Pay Yourself Second' : 'Pay Yourself First'}
      </h2>
      <p className="text-gray-600 text-center mb-8">
        "The wise store up choice food and olive oil" - Proverbs 21:20. 
        Set aside money for emergencies and future goals.
      </p>
      
      <div className="card">
        <label className="label">Emergency Fund / Savings Percentage</label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="20"
            step="0.5"
            value={settings.emergencyFundPercentage}
            onChange={(e) => updateSettings({ emergencyFundPercentage: parseFloat(e.target.value) })}
            className="flex-1"
          />
          <div className="text-right min-w-[80px]">
            <div className="text-lg font-semibold">{settings.emergencyFundPercentage}%</div>
            <div className="text-sm text-gray-500">
              ${(settings.paycheckAmount * settings.emergencyFundPercentage / 100).toFixed(0)}
            </div>
          </div>
        </div>
        
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">Recommended: 3-5%</h4>
            <p className="text-sm text-green-700">
              Start with 3-5% to build your emergency fund, then adjust as needed for other goals.
            </p>
          </div>
          
          <div className="text-sm text-gray-600">
            <h5 className="font-medium mb-2">Current Allocation Summary:</h5>
            {settings.tithingEnabled && (
              <div className="flex justify-between">
                <span>Tithing:</span>
                <span>{settings.tithingPercentage}% (${(settings.paycheckAmount * settings.tithingPercentage / 100).toFixed(0)})</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Savings:</span>
              <span>{settings.emergencyFundPercentage}% (${(settings.paycheckAmount * settings.emergencyFundPercentage / 100).toFixed(0)})</span>
            </div>
            <div className="flex justify-between font-medium border-t pt-2 mt-2">
              <span>Remaining for bills & expenses:</span>
              <span>
                {(100 - (settings.tithingPercentage ?? 0) - (settings.emergencyFundPercentage ?? 0)).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex gap-4 mt-8">
        <button onClick={prevStep} className="btn-secondary flex-1">
          Back
        </button>
        <button onClick={nextStep} className={settings.faithBasedMode ? 'btn-faith flex-1' : 'btn-primary flex-1'}>
          Continue
        </button>
      </div>
    </div>
  )

  // POCKET MONEY STEP (fixed for build error)
  const renderPocketMoneyStep = () => (
    <div className="max-w-xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-6">
        {settings.faithBasedMode
          ? 'Set Your Pocket Money (What Do You Want Left for Fun?)'
          : 'How Much "Fun Money" Do You Want Each Month?'}
      </h2>
      <p className="text-gray-600 text-center mb-8">
        {settings.faithBasedMode
          ? 'After honoring God and saving, choose how much you want to set aside for personal enjoyment, hobbies, or treats each paycheck.'
          : 'After saving, what percentage of your income would you like to dedicate to personal spending (fun, hobbies, treats)?'}
      </p>
      <div className="card">
        <label className="label">Pocket Money Percentage</label>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max="20"
            step="0.5"
            value={settings.pocketMoneyPercentage ?? 0}
            onChange={(e) =>
              updateSettings({ pocketMoneyPercentage: parseFloat(e.target.value) })
            }
            className="flex-1"
          />
          <div className="text-right min-w-[80px]">
            <div className="text-lg font-semibold">
              {settings.pocketMoneyPercentage ?? 0}%
            </div>
            <div className="text-sm text-gray-500">
              ${((settings.paycheckAmount * (settings.pocketMoneyPercentage ?? 0)) / 100).toFixed(0)}
            </div>
          </div>
        </div>
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-2">Be Intentional</h4>
          <p className="text-sm text-yellow-700">
            Setting aside money for personal use ensures you can enjoy life while staying on budget.
          </p>
        </div>
      </div>
      <div className="flex gap-4 mt-8">
        <button onClick={prevStep} className="btn-secondary flex-1">
          Back
        </button>
        <button onClick={nextStep} className="btn-primary flex-1">
          Continue
        </button>
      </div>
    </div>
  )

  const renderCompleteStep = () => (
    <div className="max-w-xl mx-auto text-center">
      <div className="text-6xl mb-6">🎉</div>
      <h2 className="text-3xl font-bold mb-6">Setup Complete!</h2>
      <p className="text-gray-600 mb-8">
        Your {settings.faithBasedMode ? 'faith-based' : 'secular'} financial foundation is ready. 
        Next, we'll help you add your bills and create purpose-driven accounts.
      </p>
      
      <div className="card text-left mb-8">
        <h3 className="font-semibold mb-4">Your Financial Priorities:</h3>
        <div className="space-y-2 text-sm">
          {settings.tithingEnabled && (
            <div className="flex justify-between">
              <span>🙏 Tithing (Honor God first):</span>
              <span className="font-medium">{settings.tithingPercentage}%</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>💰 Emergency Fund (Pay yourself):</span>
            <span className="font-medium">{settings.emergencyFundPercentage}%</span>
          </div>
          <div className="flex justify-between">
            <span>🪙 Pocket Money (Personal wishes):</span>
            <span className="font-medium">{settings.pocketMoneyPercentage ?? 0}%</span>
          </div>
          <div className="flex justify-between">
            <span>📋 Available for Bills & Goals:</span>
            <span className="font-medium">
              {(100 - (settings.tithingPercentage ?? 0) - (settings.emergencyFundPercentage ?? 0) - (settings.pocketMoneyPercentage ?? 0)).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
      
      <button onClick={nextStep} className={settings.faithBasedMode ? 'btn-faith' : 'btn-primary'}>
        Go to Dashboard
      </button>
    </div>
  )

  const getStepIndicator = () => {
    const steps = [
      { key: SETUP_STEPS.APPROACH, label: 'Approach' },
      { key: SETUP_STEPS.INCOME, label: 'Income' },
      { key: SETUP_STEPS.PAYFREQUENCY, label: 'Pay Schedule' },
      ...(settings.tithingEnabled ? [{ key: SETUP_STEPS.TITHING, label: 'Tithing' }] : []),
      { key: SETUP_STEPS.SAVINGS, label: 'Savings' },
      { key: SETUP_STEPS.POCKET_MONEY, label: 'Pocket Money' },
      { key: SETUP_STEPS.COMPLETE, label: 'Complete' }
    ]
    const currentIndex = steps.findIndex(step => step.key === currentStep)
    return (
      <div className="flex justify-center mb-8">
        <div className="flex items-center space-x-2">
          {steps.map((step, index) => (
            <div key={step.key} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                index <= currentIndex 
                  ? settings.faithBasedMode 
                    ? 'bg-faith-500 text-white' 
                    : 'bg-primary-500 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {index + 1}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-8 h-1 mx-2 ${
                  index < currentIndex 
                    ? settings.faithBasedMode 
                      ? 'bg-faith-500' 
                      : 'bg-primary-500'
                    : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-faith-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Financial Setup</h1>
          <p className="text-gray-600">Let's set up your biblical stewardship system</p>
          
          <div className="mt-4 p-3 bg-faith-50 border border-faith-200 rounded-lg max-w-2xl mx-auto">
            <p className="text-faith-800 font-medium text-sm">
              ✨ <span className="font-bold">Ready to commit:</span> Honor God first, pay yourself second, and never worry about bill money again
            </p>
          </div>
        </div>
        
        {getStepIndicator()}
        
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {currentStep === SETUP_STEPS.APPROACH && renderApproachStep()}
          {currentStep === SETUP_STEPS.INCOME && renderIncomeStep()}
          {currentStep === SETUP_STEPS.PAYFREQUENCY && renderPayFrequencyStep()}
          {currentStep === SETUP_STEPS.TITHING && renderTithingStep()}
          {currentStep === SETUP_STEPS.SAVINGS && renderSavingsStep()}
          {currentStep === SETUP_STEPS.POCKET_MONEY && renderPocketMoneyStep()}
          {currentStep === SETUP_STEPS.COMPLETE && renderCompleteStep()}
        </div>
      </div>
    </div>
  )
}
