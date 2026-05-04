'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Layers, ArrowUp, ArrowDown, RefreshCw } from 'lucide-react'
import Header from '@/components/layout/Header'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'
import Input from '@/components/ui/Input'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { formatDateTime, getStockStatus } from '@/lib/utils'

interface Movement {
  id: string; type: 'IN' | 'OUT' | 'ADJUSTMENT'; quantity: number; reason: string | null
  product: { id: string; name: string; quantity: number }; user: { name: string }; createdAt: string
}

interface Product { id: string; name: string; quantity: number; category: string }

export default function StockPage() {
  const [movements, setMovements] = useState<Movement[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ productId: '', type: 'IN' as 'IN'|'OUT'|'ADJUSTMENT', quantity: '1', reason: '' })
  const pageSize = 15

  const loadMovements = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/stock?page=${page}&pageSize=${pageSize}`)
      const data = await res.json()
      setMovements(data.data ?? [])
      setTotal(data.total ?? 0)
    } finally { setLoading(false) }
  }, [page])

  useEffect(() => { loadMovements() }, [loadMovements])

  useEffect(() => {
    fetch('/api/products?pageSize=100').then(r => r.json()).then(d => setProducts(d.data ?? []))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const res = await fetch('/api/stock', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({...form, quantity: parseInt(form.quantity)}) })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setModalOpen(false); setForm({ productId: '', type: 'IN', quantity: '1', reason: '' }); loadMovements()
    } finally { setSaving(false) }
  }

  const typeConfig = {
    IN: { label: 'Entrada', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: <ArrowUp className="w-3.5 h-3.5" /> },
    OUT: { label: 'Saída', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: <ArrowDown className="w-3.5 h-3.5" /> },
    ADJUSTMENT: { label: 'Ajuste', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', icon: <RefreshCw className="w-3.5 h-3.5" /> },
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div>
      <Header title="Controle de Estoque" subtitle="Histórico de movimentações"
        actions={<Button onClick={() => { setError(''); setModalOpen(true) }}><Plus className="w-4 h-4" />Movimentar Estoque</Button>} />

      <div className="px-4 lg:px-8 py-6 space-y-4 animate-fade-in">
        {/* Low stock products */}
        {products.filter(p => p.quantity < 10).length > 0 && (
          <div className="bg-gray-900 border border-amber-500/20 rounded-2xl p-4">
            <p className="text-sm font-semibold text-amber-400 mb-3">⚠️ Produtos com estoque baixo</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {products.filter(p => p.quantity < 10).map(p => {
                const stock = getStockStatus(p.quantity)
                return (
                  <div key={p.id} className="flex items-center justify-between px-3 py-2 bg-gray-800 rounded-lg">
                    <span className="text-xs text-white truncate mr-2">{p.name}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${stock.color}`}>{p.quantity}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          {loading ? <PageLoader /> : movements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-500">
              <Layers className="w-12 h-12 text-gray-700" />
              <p className="font-medium">Nenhuma movimentação registrada</p>
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="sm:hidden divide-y divide-gray-800">
                {movements.map((m) => {
                  const cfg = typeConfig[m.type]
                  return (
                    <div key={m.id} className="px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-white truncate">{m.product.name}</p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border shrink-0 ${cfg.bg} ${cfg.color}`}>
                          {cfg.icon}{cfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                        <span className="font-semibold text-white">{m.type === 'OUT' ? '-' : '+'}{m.quantity} un</span>
                        <span>Estoque: <span className={m.product.quantity < 10 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>{m.product.quantity}</span></span>
                        {m.reason && <span>{m.reason}</span>}
                        <span>{formatDateTime(m.createdAt)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Desktop table */}
              <table className="hidden sm:table w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    {['Produto','Tipo','Quantidade','Estoque Atual','Motivo','Usuário','Data'].map(h => (
                      <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => {
                    const cfg = typeConfig[m.type]
                    return (
                      <tr key={m.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-white">{m.product.name}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.color}`}>
                            {cfg.icon}{cfg.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-white">{m.type === 'OUT' ? '-' : '+'}{m.quantity}</td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-bold ${m.product.quantity < 10 ? 'text-amber-400' : 'text-emerald-400'}`}>{m.product.quantity}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">{m.reason || '—'}</td>
                        <td className="px-6 py-4 text-sm text-gray-400">{m.user.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-400">{formatDateTime(m.createdAt)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">Página {page} de {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page<=1} onClick={() => setPage(p=>p-1)}>Anterior</Button>
              <Button variant="outline" size="sm" disabled={page>=totalPages} onClick={() => setPage(p=>p+1)}>Próximo</Button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Movimentar Estoque">
        <form onSubmit={handleSave} className="space-y-4">
          {error && <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>}
          <Select label="Produto" value={form.productId} onChange={e => setForm({...form, productId: e.target.value})}
            options={products.map(p => ({ value: p.id, label: `${p.name} (${p.quantity} em estoque)` }))} placeholder="Selecione..." required />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Tipo" value={form.type} onChange={e => setForm({...form, type: e.target.value as any})}
              options={[{value:'IN',label:'Entrada'},{value:'OUT',label:'Saída'},{value:'ADJUSTMENT',label:'Ajuste'}]} />
            <Input label="Quantidade" type="number" min="1" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} required />
          </div>
          <Input label="Motivo (opcional)" value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} placeholder="Ex: Compra de fornecedor, avaria..." />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button type="submit" loading={saving} className="flex-1">Registrar</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
