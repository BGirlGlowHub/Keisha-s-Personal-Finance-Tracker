import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Faith-Based Expense Tracker',
  description: 'Honor God first, pay yourself second, cover your bills automatically',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">
        <div className="min-h-screen flex flex-col">
          <main className="flex-1">
            {children}
          </main>
          <footer className="bg-white border-t border-gray-200 py-4">
            <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-600">
              <p>Built with faith-based stewardship principles • Honor God • Pay Yourself • Cover Bills</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}