'use client'

import { useState, useMemo } from 'react'
import { CalendarEvent } from '@/types'
import { formatCurrency } from '@/utils/calculations'

interface CalendarProps {
  events: CalendarEvent[]
  paycheckAmount: number
}

const Calendar = ({ events, paycheckAmount }: CalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  const { calendarDays, monthEvents } = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    
    // Get first day of month and how many days
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    // Create calendar grid
    const days = []
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }
    
    // Filter events for current month
    const monthStart = new Date(year, month, 1).toISOString().split('T')[0]
    const monthEnd = new Date(year, month + 1, 0).toISOString().split('T')[0]
    
    const monthEvents = events.filter(event => 
      event.date >= monthStart && event.date <= monthEnd
    )
    
    return { calendarDays: days, monthEvents }
  }, [currentMonth, events])
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }
  
  const getEventsForDay = (day: number) => {
    const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      .toISOString().split('T')[0]
    return monthEvents.filter(event => event.date === dateStr)
  }
  
  const getEventColor = (event: CalendarEvent) => {
    switch (event.type) {
      case 'paycheck':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'bill':
        return event.status === 'overdue' 
          ? 'bg-red-100 text-red-800 border-red-200'
          : 'bg-blue-100 text-blue-800 border-blue-200'
      case 'goal_milestone':
        return event.status === 'completed'
          ? 'bg-purple-100 text-purple-800 border-purple-200'
          : 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'debt_payment':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }
  
  const getEventIcon = (event: CalendarEvent) => {
    switch (event.type) {
      case 'paycheck': return '💰'
      case 'bill': return '📋'
      case 'goal_milestone': return '🎯'
      case 'debt_payment': return '💳'
      default: return '📅'
    }
  }
  
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const today = new Date().getDate()
  const currentMonthYear = new Date()
  const isCurrentMonth = currentMonth.getMonth() === currentMonthYear.getMonth() && 
                         currentMonth.getFullYear() === currentMonthYear.getFullYear()
  
  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <button 
          onClick={() => navigateMonth('prev')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <span className="text-xl">←</span>
        </button>
        <h2 className="text-xl font-semibold">{monthName}</h2>
        <button 
          onClick={() => navigateMonth('next')}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <span className="text-xl">→</span>
        </button>
      </div>
      
      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-0 border-b border-gray-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 bg-gray-50">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0" style={{ minHeight: '400px' }}>
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="border-r border-b border-gray-100 p-1"></div>
          }
          
          const dayEvents = getEventsForDay(day)
          const isToday = isCurrentMonth && day === today
          
          return (
            <div 
              key={`day-${index}`} 
              className={`border-r border-b border-gray-100 p-1 min-h-[80px] ${
                isToday ? 'bg-blue-50' : ''
              }`}
            >
              <div className={`text-sm font-medium mb-1 ${
                isToday ? 'text-blue-600 font-bold' : 'text-gray-900'
              }`}>
                {day}
              </div>
              
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map(event => (
                  <div 
                    key={event.id} 
                    className={`text-xs p-1 rounded border ${getEventColor(event)} truncate`}
                    title={`${event.title}${event.amount ? ` - ${formatCurrency(event.amount)}` : ''}`}
                  >
                    <span className="mr-1">{getEventIcon(event)}</span>
                    {event.title}
                    {event.amount && (
                      <span className="block">
                        {event.type === 'paycheck' ? formatCurrency(paycheckAmount) : formatCurrency(event.amount)}
                      </span>
                    )}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500 p-1">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Legend */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Legend:</h3>
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-100 border border-green-200 rounded mr-1"></div>
            <span>💰 Paycheck</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded mr-1"></div>
            <span>📋 Bills</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded mr-1"></div>
            <span>🎯 Goals</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-orange-100 border border-orange-200 rounded mr-1"></div>
            <span>💳 Debt Payments</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Calendar