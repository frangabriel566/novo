'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, ShoppingCart, Eye, Trash2, CheckCircle, Clock, XCircle } from 'lucide-react'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { Sale } from '@/types'
import { formatCurrency, formatDateTime, getStatusColor, getStatusLabel } from '@/lib/utils'

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [viewSale, setViewSale] = useState<Sale | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const pageSize = 10

  const loadSales = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        search,
        status: statusFilter,
        page: String(page),
        pageSize: String(pageSize),
      })
      const res = await fetch(`/api/sales?${params}`)
      const data = await res.json()
      setSales(data.data ?? [])
      setTotal(data.total ?? 0)
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, page])

  useEffect(() => {
    const timer = setTimeout(loadSales, 300)
    return () => clearTimeout(timer)
  }, [loadSales])

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      await fetch(`/api/sales/${deleteId}`, { method: 'DELETE' })
      setDeleteId(null)
      loadSales()
    } finally {
      setDeleting(false)
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'COMPLETED') return <CheckCircle className="w-4 h-4 text-emerald-400" />
    if (status === 'PENDING') return <Clock className="w-4 h-4 text-amber-400" />
    return <XCircle className="w-4 h-4 text-red-400" />
  }

  return (
    <div>
      <Header
        title="Vendas"
        subtitle={`${total} venda${total !== 1 ? 's' : ''} registrada${total !== 1 ? 's' : ''}`}
        actions={
          <Link href="/sales/new">
            <Button>
              <Plus className="w-4 h-4" />
              Nova Venda
            </Button>
          </Link>
        }
      />

      <div className="px-8 py-6 space-y-4 animate-fade-in">
        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Buscar por cliente..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            options={[
              { value: 'COMPLETED', label: 'Concluídas' },
              { value: 'PENDING', label: 'Pendentes' },
              { value: 'CANCELLED', label: 'Canceladas' },
            ]}
            placeholder="Todos os status"
            className="w-48"
          />
        </div>

        {/* Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          {loading ? (
            <PageLoader />
          ) : sales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500 gap-3">
              <ShoppingCart className="w-12 h-12 text-gray-700" />
              <p className="text-base font-medium">Nenhuma venda encontrada</p>
              <Link href="/sales/new">
                <Button size="sm">
                  <Plus className="w-4 h-4" />
                  Criar venda
                </Button>
              </Link>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Cliente</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Produtos</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Total</th>
                  <th className="text-center px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Data</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-xs">
                          {sale.customer.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-white">{sale.customer.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-400">
                        {sale.items.length} {sale.items.length === 1 ? 'item' : 'itens'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-semibold text-white">{formatCurrency(sale.total)}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(sale.status)}`}>
                        <StatusIcon status={sale.status} />
                        {getStatusLabel(sale.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-400">{formatDateTime(sale.createdAt)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setViewSale(sale)}
                          className="p-2 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(sale.id)}
                          className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Mostrando {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} de {total}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Próximo</Button>
            </div>
          </div>
        )}
      </div>

      {/* View Sale Modal */}
      {viewSale && (
        <Modal isOpen={!!viewSale} onClose={() => setViewSale(null)} title="Detalhes da Venda" size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800/50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Cliente</p>
                <p className="text-sm font-medium text-white">{viewSale.customer.name}</p>
                <p className="text-xs text-gray-400">{viewSale.customer.email}</p>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(viewSale.status)}`}>
                  {getStatusLabel(viewSale.status)}
                </span>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-3">Produtos</p>
              <div className="space-y-2">
                {viewSale.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-300">
                      {item.product.name} × {item.quantity}
                    </span>
                    <span className="text-white font-medium">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-700 mt-3 pt-3 flex justify-between">
                <span className="text-sm font-semibold text-gray-300">Total</span>
                <span className="text-base font-bold text-amber-400">{formatCurrency(viewSale.total)}</span>
              </div>
            </div>

            {viewSale.notes && (
              <div className="bg-gray-800/50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Observações</p>
                <p className="text-sm text-gray-300">{viewSale.notes}</p>
              </div>
            )}

            <p className="text-xs text-gray-500 text-right">
              Criada em {formatDateTime(viewSale.createdAt)} por {viewSale.user.name}
            </p>
          </div>
        </Modal>
      )}

      {/* Delete Modal */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Remover Venda" size="sm">
        <p className="text-gray-300 text-sm mb-6">
          Tem certeza que deseja remover esta venda? O estoque dos produtos será restaurado.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setDeleteId(null)} className="flex-1">Cancelar</Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting} className="flex-1">Remover</Button>
        </div>
      </Modal>
    </div>
  )
}
