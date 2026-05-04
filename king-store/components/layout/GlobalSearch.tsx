'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Package, Users, ShoppingCart, X, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'

interface SearchResult {
  products: { id: string; name: string; price: number; category: string }[]
  customers: { id: string; name: string; email: string }[]
  sales: { id: string; total: number; customerName: string }[]
}

export default function GlobalSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<SearchResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  useEffect(() => {
    if (!query.trim()) { setResults(null); return }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data.data)
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  function navigate(path: string) {
    router.push(path)
    setOpen(false)
    setQuery('')
    setResults(null)
  }

  const hasResults = results && (
    results.products.length + results.customers.length + results.sales.length > 0
  )

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-gray-400 transition-colors"
      >
        <Search className="w-4 h-4" />
        <span className="hidden md:inline">Buscar...</span>
        <kbd className="hidden md:inline text-xs bg-gray-700 px-1.5 py-0.5 rounded">Ctrl K</kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-xl bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
              {loading ? <Loader2 className="w-4 h-4 text-gray-400 animate-spin shrink-0" /> : <Search className="w-4 h-4 text-gray-400 shrink-0" />}
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar produtos, clientes, vendas..."
                className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none text-sm"
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-gray-500 hover:text-gray-300">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {!query && (
              <div className="px-4 py-6 text-center text-gray-500 text-sm">
                Digite para buscar em produtos, clientes e vendas
              </div>
            )}

            {query && !loading && !hasResults && (
              <div className="px-4 py-6 text-center text-gray-500 text-sm">
                Nenhum resultado para "{query}"
              </div>
            )}

            {hasResults && (
              <div className="max-h-96 overflow-y-auto py-2">
                {results!.products.length > 0 && (
                  <div>
                    <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Produtos</p>
                    {results!.products.map((p) => (
                      <button key={p.id} onClick={() => navigate('/products')}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800 transition-colors text-left">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4 text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{p.name}</p>
                          <p className="text-xs text-gray-500">{p.category} • {formatCurrency(p.price)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {results!.customers.length > 0 && (
                  <div>
                    <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Clientes</p>
                    {results!.customers.map((c) => (
                      <button key={c.id} onClick={() => navigate('/customers')}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800 transition-colors text-left">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 text-blue-400 font-bold text-xs">
                          {c.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{c.name}</p>
                          <p className="text-xs text-gray-500 truncate">{c.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {results!.sales.length > 0 && (
                  <div>
                    <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendas</p>
                    {results!.sales.map((s) => (
                      <button key={s.id} onClick={() => navigate('/sales')}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800 transition-colors text-left">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                          <ShoppingCart className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{s.customerName}</p>
                          <p className="text-xs text-gray-500">{formatCurrency(s.total)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
