'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Crown, LayoutDashboard, Package, Users, ShoppingCart,
  LogOut, ChevronRight, BarChart3, DollarSign, Layers,
  UserCog, Sun, Moon, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { useTheme } from '@/context/ThemeContext'

const navItems = [
  { label: 'Dashboard',  href: '/dashboard',  icon: LayoutDashboard },
  { label: 'Produtos',   href: '/products',   icon: Package },
  { label: 'Estoque',    href: '/stock',      icon: Layers },
  { label: 'Clientes',   href: '/customers',  icon: Users },
  { label: 'Vendas',     href: '/sales',      icon: ShoppingCart },
  { label: 'Despesas',   href: '/expenses',   icon: DollarSign },
  { label: 'Relatórios', href: '/reports',    icon: BarChart3 },
  { label: 'Usuários',   href: '/users',      icon: UserCog },
]

interface SidebarProps {
  userName?: string
  userEmail?: string
  isOpen?: boolean
  onClose?: () => void
}

export default function Sidebar({ userName, userEmail, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } finally {
      setLoggingOut(false)
    }
  }

  function handleNavClick() {
    onClose?.()
  }

  return (
    <aside className={cn(
      'fixed left-0 top-0 h-full w-64 bg-gray-900 border-r border-gray-800 flex flex-col z-50 transition-transform duration-300',
      // Desktop: always visible
      'lg:translate-x-0',
      // Mobile: slide in/out
      isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    )}>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-800 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3 group" onClick={handleNavClick}>
          <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:shadow-amber-500/50 transition-shadow">
            <Crown className="w-5 h-5 text-gray-900" />
          </div>
          <div>
            <span className="text-white font-bold text-lg tracking-tight">KING</span>
            <span className="text-amber-500 font-bold text-lg tracking-tight"> STORE</span>
          </div>
        </Link>
        {/* Close button mobile */}
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link key={item.href} href={item.href} onClick={handleNavClick}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800 border border-transparent'
              )}>
              <Icon className={cn('w-5 h-5 shrink-0', isActive ? 'text-amber-400' : 'text-gray-500 group-hover:text-gray-300')} />
              <span>{item.label}</span>
              {isActive && <ChevronRight className="w-4 h-4 ml-auto text-amber-400" />}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-gray-800 space-y-1">
        <Link href="/profile" onClick={handleNavClick}
          className="px-3 py-2.5 rounded-lg bg-gray-800/50 flex items-center gap-3 hover:bg-gray-800 transition-colors">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-sm shrink-0">
            {userName?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{userName}</p>
            <p className="text-xs text-amber-500/70 truncate">Usuário</p>
          </div>
        </Link>

        <button onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-all duration-200">
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span>{theme === 'dark' ? 'Tema claro' : 'Tema escuro'}</span>
        </button>

        <button onClick={handleLogout} disabled={loggingOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 disabled:opacity-50">
          <LogOut className="w-5 h-5" />
          <span>{loggingOut ? 'Saindo...' : 'Sair'}</span>
        </button>
      </div>
    </aside>
  )
}
