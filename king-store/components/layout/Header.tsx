'use client'

import GlobalSearch from './GlobalSearch'
import NotificationBell from './NotificationBell'

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export default function Header({ title, subtitle, actions }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800 px-4 lg:px-8 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg lg:text-xl font-bold text-white truncate">{title}</h1>
          {subtitle && <p className="text-xs lg:text-sm text-gray-400 mt-0.5 truncate">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 lg:gap-3 shrink-0">
          <GlobalSearch />
          <NotificationBell />
          {actions}
        </div>
      </div>
    </header>
  )
}
