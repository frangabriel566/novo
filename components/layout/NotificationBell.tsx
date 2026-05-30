'use client'

import { useState, useEffect } from 'react'
import { Bell, AlertTriangle, ShoppingCart, X, Cake, Trophy, MessageCircle, Trash2 } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

interface Notification {
  id: string
  type: 'low_stock' | 'new_sale' | 'pending_sale' | 'birthday' | 'goal_reached'
  title: string
  message: string
  waLink?: string | null
  customerId?: string | null
  customerName?: string | null
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

  function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
  }

  function deleteNotification(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const unread = notifications.filter((n) => !n.read).length

  const icons: Record<Notification['type'], React.ReactNode> = {
    low_stock: <AlertTriangle className="w-4 h-4 text-amber-400" />,
    new_sale: <ShoppingCart className="w-4 h-4 text-emerald-400" />,
    pending_sale: <ShoppingCart className="w-4 h-4 text-blue-400" />,
    birthday: <Cake className="w-4 h-4 text-pink-400" />,
    goal_reached: <Trophy className="w-4 h-4 text-amber-400" />,
  }

  const sorted = [...notifications].sort((a, b) => {
    const priority = (n: Notification) => {
      if (!n.read && (n.type === 'birthday' || n.type === 'goal_reached')) return 0
      if (!n.read) return 1
      return 2
    }
    return priority(a) - priority(b)
  })

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
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />

          <div className={[
            'z-40 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden',
            'fixed left-4 right-4 top-20',
            'sm:fixed sm:left-auto sm:right-4 sm:top-auto sm:absolute sm:right-0 sm:top-12 sm:w-96',
          ].join(' ')}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <h3 className="text-sm font-semibold text-white">Notificações</h3>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
                    Marcar todas como lidas
                  </button>
                )}
                {sorted.length > 0 && (
                  <button
                    onClick={() => setNotifications([])}
                    className="text-xs text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1"
                    title="Excluir todas"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-300">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[70vh] overflow-y-auto">
              {loading ? (
                <div className="py-8 text-center text-gray-500 text-sm">Carregando...</div>
              ) : sorted.length === 0 ? (
                <div className="py-8 text-center">
                  <Bell className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Nenhuma notificação</p>
                </div>
              ) : (
                sorted.map((n) => (
                  <div
                    key={n.id}
                    className={[
                      'flex gap-3 px-4 py-3 border-b border-gray-800/50 last:border-0',
                      !n.read && n.type === 'birthday' ? 'bg-pink-500/5' : '',
                      !n.read && n.type === 'goal_reached' ? 'bg-amber-500/5' : '',
                      !n.read && n.type !== 'birthday' && n.type !== 'goal_reached' ? 'bg-amber-500/5' : '',
                    ].join(' ')}
                  >
                    <div className="mt-0.5 shrink-0">{icons[n.type]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">{n.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{n.message}</p>

                      {n.waLink ? (
                        <a
                          href={n.waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => markRead(n.id)}
                          className={[
                            'inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                            n.type === 'birthday'
                              ? 'bg-pink-500/15 hover:bg-pink-500/25 text-pink-400 border border-pink-500/30'
                              : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30',
                          ].join(' ')}
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          {n.type === 'birthday' ? 'Enviar parabéns no WhatsApp 🎉' : 'Avisar sobre o prêmio no WhatsApp 🏆'}
                        </a>
                      ) : (n.type === 'birthday' || n.type === 'goal_reached') ? (
                        <p className="text-xs text-gray-600 mt-1 italic">Sem telefone cadastrado</p>
                      ) : null}

                      <p className="text-xs text-gray-600 mt-1">{formatDateTime(n.createdAt)}</p>
                    </div>
                    <div className="flex flex-col items-center gap-2 shrink-0">
                      {!n.read && <div className="w-2 h-2 bg-amber-500 rounded-full" />}
                      <button
                        onClick={() => deleteNotification(n.id)}
                        className="text-gray-600 hover:text-red-400 transition-colors mt-0.5"
                        title="Excluir notificação"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
