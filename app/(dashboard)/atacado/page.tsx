'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Boxes, Edit2, X } from 'lucide-react'
import Header from '@/components/layout/Header'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { Product } from '@/types'
import { formatCurrency } from '@/lib/utils'

function centsToDisplay(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',')
}

export default function AtacadoPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [priceCents, setPriceCents] = useState(0)
  const [minQty, setMinQty] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const pageSize = 10

  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ search, page: String(page), pageSize: String(pageSize) })
      const res = await fetch(`/api/products?${params}`)
      const data = await res.json()
      setProducts(data.data ?? [])
      setTotal(data.total ?? 0)
    } finally { setLoading(false) }
  }, [search, page])

  useEffect(() => {
    const timer = setTimeout(loadProducts, 300)
    return () => clearTimeout(timer)
  }, [loadProducts])

  function openEdit(product: Product) {
    setEditProduct(product)
    setPriceCents(Math.round((product.wholesalePrice ?? 0) * 100))
    setMinQty(product.wholesaleMinQty ? String(product.wholesaleMinQty) : '')
    setError('')
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editProduct) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/products/${editProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wholesalePrice: priceCents / 100,
          wholesaleMinQty: minQty ? Number(minQty) : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao salvar'); return }
      setEditProduct(null)
      loadProducts()
    } finally { setSaving(false) }
  }

  async function handleRemove(product: Product) {
    await fetch(`/api/products/${product.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wholesalePrice: null, wholesaleMinQty: null }),
    })
    loadProducts()
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div>
      <Header
        title="Atacado"
        subtitle="Configure preços de atacado e quantidade mínima por produto"
      />

      <div className="px-4 lg:px-8 py-6 space-y-4 animate-fade-in">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="text" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Buscar produto por nome, categoria..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors" />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          {loading ? <PageLoader /> : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500 gap-3">
              <Boxes className="w-12 h-12 text-gray-700" />
              <p className="text-base font-medium">Nenhum produto encontrado</p>
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="sm:hidden divide-y divide-gray-800">
                {products.map((product) => (
                  <div key={product.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                      <Boxes className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{product.name}</p>
                      <p className="text-xs text-gray-400">Varejo: {formatCurrency(product.price)}</p>
                      {product.wholesalePrice != null ? (
                        <p className="text-xs text-emerald-400">Atacado: {formatCurrency(product.wholesalePrice)} a partir de {product.wholesaleMinQty} un</p>
                      ) : (
                        <p className="text-xs text-gray-500">Sem preço de atacado</p>
                      )}
                    </div>
                    <button onClick={() => openEdit(product)}
                      className="p-2 rounded-lg text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <table className="hidden sm:table w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Produto</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Preço varejo</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Preço atacado</th>
                    <th className="text-center px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Qtd mínima</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                            <Boxes className="w-4 h-4 text-amber-400" />
                          </div>
                          <span className="text-sm font-medium text-white">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right"><span className="text-sm text-gray-300">{formatCurrency(product.price)}</span></td>
                      <td className="px-6 py-4 text-right">
                        {product.wholesalePrice != null ? (
                          <span className="text-sm font-semibold text-emerald-400">{formatCurrency(product.wholesalePrice)}</span>
                        ) : (
                          <span className="text-sm text-gray-600">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm text-gray-300">{product.wholesaleMinQty ?? '—'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(product)} className="p-2 rounded-lg text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"><Edit2 className="w-4 h-4" /></button>
                          {product.wholesalePrice != null && (
                            <button onClick={() => handleRemove(product)} title="Remover preço de atacado" className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"><X className="w-4 h-4" /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">Mostrando {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} de {total}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Próximo</Button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={!!editProduct} onClose={() => setEditProduct(null)} title="Preço de Atacado" size="sm">
        {editProduct && (
          <form onSubmit={handleSave} className="space-y-4">
            {error && <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>}
            <div className="bg-gray-800/50 rounded-xl p-3">
              <p className="text-sm font-medium text-white">{editProduct.name}</p>
              <p className="text-xs text-gray-400">Preço de venda (varejo): {formatCurrency(editProduct.price)}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-300">Preço de atacado (R$)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={centsToDisplay(priceCents)}
                  onChange={(e) => setPriceCents(parseInt(e.target.value.replace(/\D/g, '') || '0', 10))}
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg text-sm bg-gray-800 border border-gray-600 hover:border-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors"
                />
              </div>
            </div>
            <Input
              label="Quantidade mínima para aplicar o preço de atacado"
              type="number"
              min={1}
              value={minQty}
              onChange={(e) => setMinQty(e.target.value)}
              placeholder="Ex: 10"
            />
            <p className="text-xs text-gray-500">
              O preço de atacado é aplicado automaticamente quando o cliente é do tipo Atacado, ou quando a quantidade do item na venda atinge o mínimo configurado aqui.
            </p>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setEditProduct(null)} className="flex-1">Cancelar</Button>
              <Button type="submit" loading={saving} className="flex-1">Salvar</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
