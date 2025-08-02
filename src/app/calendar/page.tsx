'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Calendar from '@/components/Calendar'
import Navigation from '@/components/Navigation'
import { CalendarEvent, Account, Bill, Debt, SavingsGoal, StewardshipSettings } from '@/types'
import { getAccounts, getBills, getDebts, getSavingsGoals, getSettingsFromStorage } from '@/utils/storage'
import { generateCalendarEvents, formatCurrency, calculateGoalProgress } from '@/utils/calculations'

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [bills, setBills] = useState<Bill[]>([])
  const [debts, setDebts] = useState<Debt[]>([])
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [settings, setSettings] = useState<StewardshipSettings | null>(null)
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')

  useEffect(() => {
    const loadedAccounts = getAccounts()
    const loadedBills = getBills()
    const loadedDebts = getDebts()
    const loadedGoals = getSavingsGoals()
    const loadedSettings = getSettingsFromStorage()
    
    setAccounts(loadedAccounts)
    setBills(loadedBills)
    setDebts(loadedDebts)
    setGoals(loadedGoals)
    setSettings(loadedSettings)
    
    if (loadedSettings) {
      const calendarEvents = generateCalendarEvents(
        loadedBills,
        loadedSettings.payDates,
        loadedGoals,
        loadedDebts
      )
      setEvents(calendarEvents)
    }
  }, [])

  const getUpcomingEvents = () => {
    const today = new Date()
    const nextTwoWeeks = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)
    
    return events
      .filter(event => {
        const eventDate = new Date(event.date)
        return eventDate >= today && eventDate <= nextTwoWeeks && event.status === 'upcoming'
      })
      .slice(0, 10)
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'paycheck': return '💰'
      case 'bill': return '📋'
      case 'goal_milestone': return '🎯'
      case 'debt_payment': return '💳'
      default: return '📅'
    }
  }

  const getEventColor = (type: string, status: string) => {
    if (status === 'overdue') return 'text-red-600 bg-red-50'
    
    switch (type) {
      case 'paycheck': return 'text-green-600 bg-green-50'
      case 'bill': return 'text-blue-600 bg-blue-50'
      case 'goal_milestone': return 'text-purple-600 bg-purple-50'
      case 'debt_payment': return 'text-orange-600 bg-orange-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const upcomingEvents = getUpcomingEvents()
  const activeGoals = goals.filter(goal => goal.isActive)
  const totalMonthlyContributions = activeGoals.reduce((sum, goal) => sum + goal.monthlyContribution, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Financial Calendar</h1>
              <p className="text-gray-600 mt-1">
                Track paychecks, bills, and goal milestones all in one place
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex border border-gray-300 rounded-lg">
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                    viewMode === 'calendar' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Calendar View
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                    viewMode === 'list' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  List View
                </button>
              </div>
              <Link href="/goals" className="btn-primary">
                Manage Goals
              </Link>
              <Navigation />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {viewMode === 'calendar' ? (
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Calendar */}
            <div className="lg:col-span-3">
              {settings ? (
                <Calendar events={events} paycheckAmount={settings.paycheckAmount} />
              ) : (
                <div className="card text-center py-12">
                  <p className="text-gray-600">Please complete setup to view calendar</p>
                  <Link href="/setup" className="btn-primary mt-4">Go to Setup</Link>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Upcoming Events */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">📅 Next 2 Weeks</h3>
                {upcomingEvents.length === 0 ? (
                  <p className="text-gray-500 text-sm">No upcoming events</p>
                ) : (
                  <div className="space-y-3">
                    {upcomingEvents.map(event => (
                      <div key={event.id} className={`p-3 rounded-lg ${getEventColor(event.type, event.status)}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span>{getEventIcon(event.type)}</span>
                            <span className="font-medium text-sm">{event.title}</span>
                          </div>
                          {event.amount && (
                            <span className="text-sm font-semibold">
                              {event.type === 'paycheck' && settings ? 
                                formatCurrency(settings.paycheckAmount) : 
                                formatCurrency(event.amount)
                              }
                            </span>
                          )}
                        </div>
                        <p className="text-xs mt-1">
                          {new Date(event.date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Goal Progress */}
              {activeGoals.length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-semibold mb-4">🎯 Goal Progress</h3>
                  <div className="space-y-4">
                    {activeGoals.slice(0, 3).map(goal => {
                      const progress = calculateGoalProgress(goal)
                      return (
                        <div key={goal.id}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{goal.name}</span>
                            <span className="text-sm text-gray-600">
                              {Math.round(progress.progressPercentage)}%
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
                          <p className="text-xs text-gray-500 mt-1">
                            {formatCurrency(goal.monthlyContribution)}/month • 
                            {progress.monthsRemaining} months left
                          </p>
                        </div>
                      )
                    })}
                    {activeGoals.length > 3 && (
                      <Link href="/goals" className="text-blue-600 text-sm hover:underline">
                        View all {activeGoals.length} goals →
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* Monthly Summary */}
              {settings && (
                <div className="card">
                  <h3 className="text-lg font-semibold mb-4">💰 Monthly Summary</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Income:</span>
                      <span className="font-semibold text-green-600">
                        +{formatCurrency(settings.paycheckAmount * (settings.payFrequency === 'bi-weekly' ? 26/12 : settings.payFrequency === 'weekly' ? 52/12 : settings.payFrequency === 'semi-monthly' ? 2 : 1))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bills:</span>
                      <span className="font-semibold text-red-600">
                        -{formatCurrency(bills.filter(b => b.isActive).reduce((sum, bill) => sum + bill.amount, 0))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Goal Contributions:</span>
                      <span className="font-semibold text-blue-600">
                        -{formatCurrency(totalMonthlyContributions)}
                      </span>
                    </div>
                    <div className="border-t pt-2 flex justify-between">
                      <span className="font-semibold">Net:</span>
                      <span className={`font-bold ${
                        (settings.paycheckAmount * (settings.payFrequency === 'bi-weekly' ? 26/12 : 1)) - 
                        bills.filter(b => b.isActive).reduce((sum, bill) => sum + bill.amount, 0) - 
                        totalMonthlyContributions >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(
                          (settings.paycheckAmount * (settings.payFrequency === 'bi-weekly' ? 26/12 : 1)) - 
                          bills.filter(b => b.isActive).reduce((sum, bill) => sum + bill.amount, 0) - 
                          totalMonthlyContributions
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* List View */
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">All Events (Next 3 Months)</h2>
              {events.length === 0 ? (
                <p className="text-gray-500">No events to display</p>
              ) : (
                <div className="space-y-2">
                  {events.slice(0, 50).map(event => (
                    <div key={event.id} className={`flex items-center justify-between p-3 rounded-lg ${getEventColor(event.type, event.status)}`}>
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{getEventIcon(event.type)}</span>
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm opacity-75">
                            {new Date(event.date).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric',
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {event.amount && (
                          <p className="font-semibold">
                            {event.type === 'paycheck' && settings ? 
                              formatCurrency(settings.paycheckAmount) : 
                              formatCurrency(event.amount)
                            }
                          </p>
                        )}
                        <p className={`text-xs px-2 py-1 rounded ${
                          event.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                          event.status === 'paid' ? 'bg-green-100 text-green-800' :
                          event.status === 'overdue' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {event.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}