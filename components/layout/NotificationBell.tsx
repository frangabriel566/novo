'use client'

import { useState, useEffect } from 'react'
import { Bell, AlertTriangle, ShoppingCart, X } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

interface Notification {
  id: string
  type: 'low_stock' | 'new_sale' | 'pending_sale'
  title: string
  message: string
  createdAt: string
  read: boolean
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { loadNotifications() }, [])

  async function loadNotifications() {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications')
      const data = await res.json()
      setNotifications(data.data ?? [])
    } finally { setLoading(false) }
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const unread = notifications.filter((n) => !n.read).length

  const icons = {
    low_stock: <AlertTriangle className="w-4 h-4 text-amber-400" />,
    new_sale: <ShoppingCart className="w-4 h-4 text-emerald-400" />,
    pending_sale: <ShoppingCart className="w-4 h-4 text-blue-400" />,
  }

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(!open); if (!open) loadNotifications() }}
        className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-amber-500 rounded-full text-xs text-gray-900 font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />

          {/* Mobile: fixed centered panel; Desktop: absolute dropdown */}
          <div className={[
            'z-40 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden',
            // Mobile: fixed, centered horizontally, below the header
            'fixed left-4 right-4 top-20',
            // Desktop: absolute, anchored to bell
            'sm:fixed sm:left-auto sm:right-4 sm:top-auto sm:absolute sm:right-0 sm:top-12 sm:w-80',
          ].join(' ')}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <h3 className="text-sm font-semibold text-white">Notificações</h3>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
                    Marcar todas como lidas
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-300">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="py-8 text-center text-gray-500 text-sm">Carregando...</div>
              ) : notifications.length === 0 ? (
                <div className="py-8 text-center">
                  <Bell className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Nenhuma notificação</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className={`flex gap-3 px-4 py-3 border-b border-gray-800/50 last:border-0 ${!n.read ? 'bg-amber-500/5' : ''}`}>
                    <div className="mt-0.5 shrink-0">{icons[n.type]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{n.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{n.message}</p>
                      <p className="text-xs text-gray-600 mt-1">{formatDateTime(n.createdAt)}</p>
                    </div>
                    {!n.read && <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 shrink-0" />}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
