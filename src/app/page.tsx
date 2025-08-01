'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function Home() {
  const [isSetupComplete, setIsSetupComplete] = useState(false)

  useEffect(() => {
    // Check if user has completed setup
    const setupData = localStorage.getItem('stewardship-settings')
    setIsSetupComplete(!!setupData)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-faith-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Faith-Based Finance</h1>
              <p className="text-gray-600 mt-1">Biblical stewardship made practical</p>
            </div>
            <div className="flex items-center space-x-4">
              {isSetupComplete ? (
                <Link href="/dashboard" className="btn-primary">
                  Go to Dashboard
                </Link>
              ) : (
                <Link href="/setup" className="btn-faith">
                  Get Started
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Never Worry About Money Again
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Honor God first, pay yourself second, cover your bills automatically. 
            This app calculates exactly what percentage of each paycheck needs to go 
            to each purpose-driven account using biblical financial principles.
          </p>
          
          {!isSetupComplete && (
            <>
              <div className="mb-6 p-4 bg-faith-50 border-2 border-faith-200 rounded-xl max-w-2xl mx-auto">
                <p className="text-faith-800 font-medium text-center">
                  ✨ <span className="font-bold">Disclaimer:</span> Only use if you're ready to honor God first, pay yourself second, and never worry about bill money again
                </p>
              </div>
              <Link href="/setup" className="btn-faith text-lg px-8 py-4">
                Start Your Financial Journey 🙏
              </Link>
            </>
          )}
        </div>

        {/* Value Propositions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="card text-center">
            <div className="text-4xl mb-4">🙏</div>
            <h3 className="text-lg font-semibold mb-2 text-faith-700">Honor God First</h3>
            <p className="text-gray-600 text-sm">
              Tithing and giving made automatic - faithful stewardship without fear
            </p>
          </div>
          
          <div className="card text-center">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-lg font-semibold mb-2 text-primary-700">Pay Yourself Second</h3>
            <p className="text-gray-600 text-sm">
              Emergency fund and savings goals built into your paycheck distribution
            </p>
          </div>
          
          <div className="card text-center">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-lg font-semibold mb-2 text-green-700">Bills Covered Automatically</h3>
            <p className="text-gray-600 text-sm">
              Every bill gets its percentage calculated and covered - no more stress
            </p>
          </div>
          
          <div className="card text-center">
            <div className="text-4xl mb-4">✨</div>
            <h3 className="text-lg font-semibold mb-2 text-purple-700">Live on the Rest</h3>
            <p className="text-gray-600 text-sm">
              Guilt-free spending with what remains after faithful stewardship
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-16">
          <h3 className="text-2xl font-bold text-center mb-8">How It Works</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-faith-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-faith-700">1</span>
              </div>
              <h4 className="font-semibold mb-2">Choose Your Approach</h4>
              <p className="text-gray-600 text-sm">
                Faith-based (tithing first) or secular (pay yourself first) - your choice
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-700">2</span>
              </div>
              <h4 className="font-semibold mb-2">Add Your Bills, Debts & Goals</h4>
              <p className="text-gray-600 text-sm">
                Enter all recurring expenses, bills, debt payments, and savings goals with custom names. 
                Include rent, utilities, car payments, credit cards, student loans - everything!
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-700">3</span>
              </div>
              <h4 className="font-semibold mb-2">Get Multiple Account Setup</h4>
              <p className="text-gray-600 text-sm">
                App calculates exact payroll percentages for separate bank accounts. 
                Take these percentages to HR to set up automatic direct deposits - 
                your bills get paid before you even see the money!
              </p>
            </div>
          </div>
        </div>

        {/* Biblical Foundation */}
        <div className="bg-faith-50 rounded-2xl border border-faith-200 p-8 text-center">
          <h3 className="text-2xl font-bold text-faith-800 mb-4">Built on Biblical Principles</h3>
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div>
              <p className="font-medium text-faith-700 mb-2">"Honor the Lord with your wealth, with the firstfruits of all your crops"</p>
              <p className="text-faith-600">Proverbs 3:9</p>
            </div>
            <div>
              <p className="font-medium text-faith-700 mb-2">"The wise store up choice food and olive oil"</p>
              <p className="text-faith-600">Proverbs 21:20</p>
            </div>
            <div>
              <p className="font-medium text-faith-700 mb-2">"Let no debt remain outstanding"</p>
              <p className="text-faith-600">Romans 13:8</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}