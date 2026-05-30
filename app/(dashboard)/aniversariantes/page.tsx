'use client'

import { useState, useEffect } from 'react'
import { Cake, MessageCircle, Phone, RefreshCw, PhoneOff } from 'lucide-react'
import Header from '@/components/layout/Header'

interface BirthdayCustomer {
  id: string
  name: string
  phone: string | null
  waLink: string | null
}

interface UpcomingCustomer extends BirthdayCustomer {
  daysUntil: number
  birthDay: number
  birthMonth: number
}

export default function AniversariantesPage() {
  const [todayList, setTodayList] = useState<BirthdayCustomer[]>([])
  const [upcomingList, setUpcomingList] = useState<UpcomingCustomer[]>([])
  const [discount, setDiscount] = useState('30')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/aniversariantes')
      const data = await res.json()
      setTodayList(data.today ?? [])
      setUpcomingList(data.upcoming ?? [])
      setDiscount(String(data.discount ?? 30))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div>
      <Header
        title="Aniversariantes"
        subtitle="Clientes que fazem aniversário hoje e nos próximos 7 dias"
        actions={
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 border border-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        }
      />

      <div className="px-4 lg:px-8 py-6 space-y-8 animate-fade-in">

        {/* Hoje */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-pink-500/20 border border-pink-500/30">
              <Cake className="w-4 h-4 text-pink-400" />
            </span>
            <h2 className="text-base font-semibold text-white">Aniversariantes de hoje</h2>
            {!loading && todayList.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-pink-500/20 border border-pink-500/30 text-pink-400">
                {todayList.length}
              </span>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 animate-pulse">
                  <div className="h-4 bg-gray-800 rounded w-2/3 mb-3" />
                  <div className="h-3 bg-gray-800 rounded w-1/3 mb-4" />
                  <div className="h-10 bg-gray-800 rounded-xl" />
                </div>
              ))}
            </div>
          ) : todayList.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl py-14 flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gray-800 flex items-center justify-center">
                <Cake className="w-7 h-7 text-gray-600" />
              </div>
              <p className="text-sm font-medium text-gray-400">Nenhum aniversariante hoje</p>
              <p className="text-xs text-gray-600">Clientes com data de nascimento cadastrada aparecerão aqui</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {todayList.map((c) => (
                <div
                  key={c.id}
                  className="bg-gray-900 border border-pink-500/30 rounded-2xl p-5 flex flex-col gap-4 shadow-lg shadow-pink-500/5"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400 font-bold text-lg shrink-0">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white leading-tight">{c.name}</p>
                      <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-bold bg-pink-500/15 border border-pink-500/30 text-pink-400">
                        <Cake className="w-3 h-3" /> Aniversário hoje! 🎂
                      </span>
                      {c.phone ? (
                        <p className="flex items-center gap-1 mt-1.5 text-xs text-gray-400">
                          <Phone className="w-3 h-3" /> {c.phone}
                        </p>
                      ) : (
                        <p className="flex items-center gap-1 mt-1.5 text-xs text-gray-600">
                          <PhoneOff className="w-3 h-3" /> Sem telefone cadastrado
                        </p>
                      )}
                    </div>
                  </div>

                  {c.waLink ? (
                    <a
                      href={c.waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Enviar parabéns ({discount}% desconto) 🎉
                    </a>
                  ) : (
                    <button
                      disabled
                      className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-sm font-medium bg-gray-800 text-gray-600 border border-gray-700 cursor-not-allowed"
                    >
                      <PhoneOff className="w-4 h-4" />
                      Sem telefone para enviar
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Próximos 7 dias */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/10 border border-amber-500/20">
              <Cake className="w-4 h-4 text-amber-400" />
            </span>
            <h2 className="text-base font-semibold text-white">Próximos 7 dias</h2>
            {!loading && upcomingList.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400">
                {upcomingList.length}
              </span>
            )}
          </div>

          {!loading && upcomingList.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl py-10 flex flex-col items-center text-center gap-2">
              <p className="text-sm text-gray-500">Nenhum aniversariante nos próximos 7 dias</p>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              {loading ? (
                <div className="divide-y divide-gray-800">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="px-5 py-4 flex items-center gap-4 animate-pulse">
                      <div className="w-10 h-10 rounded-xl bg-gray-800 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-800 rounded w-1/3" />
                        <div className="h-3 bg-gray-800 rounded w-1/4" />
                      </div>
                      <div className="w-28 h-9 bg-gray-800 rounded-xl" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {upcomingList.map((c) => (
                    <div key={c.id} className="px-5 py-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-sm shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{c.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-amber-400 font-semibold">
                            {c.birthDay.toString().padStart(2, '0')}/{c.birthMonth.toString().padStart(2, '0')} — em {c.daysUntil} dia{c.daysUntil !== 1 ? 's' : ''}
                          </span>
                          {c.phone
                            ? <span className="flex items-center gap-1 text-xs text-gray-500"><Phone className="w-3 h-3" />{c.phone}</span>
                            : <span className="flex items-center gap-1 text-xs text-gray-600"><PhoneOff className="w-3 h-3" />Sem telefone</span>
                          }
                        </div>
                      </div>
                      {c.waLink ? (
                        <a
                          href={c.waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors shrink-0"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          WhatsApp
                        </a>
                      ) : (
                        <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-gray-600 border border-gray-800 shrink-0">
                          <PhoneOff className="w-3.5 h-3.5" />
                          Sem telefone
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
