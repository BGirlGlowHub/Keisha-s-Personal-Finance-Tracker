'use client'

  import { useState } from 'react'
  import Link from 'next/link'

  export default function Navigation() {
    const [isDropdownOpen, setIsDropdownOpen] =
  useState(false)

    return (
      <div className="relative">
        <button
          onClick={() =>
  setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center space-x-2
  bg-blue-600 text-white px-4 py-2 rounded-lg
  hover:bg-blue-700 focus:outline-none focus:ring-2
  focus:ring-blue-500"
        >
          <span>Navigate</span>
          <svg className={`w-4 h-4 transition-transform
  ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none"
  stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round"
  strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"
   />
          </svg>
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-56
  bg-white rounded-lg shadow-lg py-2 z-50 border
  border-gray-200">
            <Link href="/dashboard" className="flex
  items-center px-4 py-2 text-sm text-gray-700
  hover:bg-gray-100" onClick={() =>
  setIsDropdownOpen(false)}>
              <span className="mr-3">🏠</span>
              Dashboard
            </Link>
            <Link href="/setup" className="flex
  items-center px-4 py-2 text-sm text-gray-700
  hover:bg-gray-100" onClick={() =>
  setIsDropdownOpen(false)}>
              <span className="mr-3">⚙️</span>
              Edit Income/Schedule
            </Link>
            <Link href="/calendar" className="flex
  items-center px-4 py-2 text-sm text-gray-700
  hover:bg-gray-100" onClick={() =>
  setIsDropdownOpen(false)}>
              <span className="mr-3">📅</span>
              Calendar
            </Link>
            <Link href="/goals" className="flex
  items-center px-4 py-2 text-sm text-gray-700
  hover:bg-gray-100" onClick={() =>
  setIsDropdownOpen(false)}>
              <span className="mr-3">🎯</span>
              Goals
            </Link>
            <Link href="/accounts" className="flex
  items-center px-4 py-2 text-sm text-gray-700
  hover:bg-gray-100" onClick={() =>
  setIsDropdownOpen(false)}>
              <span className="mr-3">🏦</span>
              Accounts
            </Link>
            <Link href="/bills" className="flex
  items-center px-4 py-2 text-sm text-gray-700
  hover:bg-gray-100" onClick={() =>
  setIsDropdownOpen(false)}>
              <span className="mr-3">📋</span>
              Bills
            </Link>
            <Link href="/debts" className="flex
  items-center px-4 py-2 text-sm text-gray-700
  hover:bg-gray-100" onClick={() =>
  setIsDropdownOpen(false)}>
              <span className="mr-3">💳</span>
              Debts
            </Link>
          </div>
        )}
      </div>
    )
  }
