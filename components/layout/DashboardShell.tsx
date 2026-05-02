'use client'

import { useState } from 'react'
import Sidebar from './Sidebar'

interface DashboardShellProps {
  children: React.ReactNode
  userName?: string
  userEmail?: string
  userRole?: string
}

export default function DashboardShell({ children, userName, userEmail, userRole }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        userName={userName}
        userEmail={userEmail}
        userRole={userRole}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 lg:ml-64 min-h-screen min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-gray-900 border-b border-gray-800">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-amber-500 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-bold text-white text-sm">KING <span className="text-amber-500">STORE</span></span>
          </div>
        </div>

        {children}
      </main>
    </div>
  )
}
