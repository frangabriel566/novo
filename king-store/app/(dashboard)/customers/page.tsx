'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Edit2, Trash2, Users, Phone } from 'lucide-react'
import Header from '@/components/layout/Header'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import CustomerForm from '@/components/customers/CustomerForm'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { Customer } from '@/types'
import { formatDate } from '@/lib/utils'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editCustomer, setEditCustomer] = useState<Customer | undefined>()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const pageSize = 10

  const loadCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ search, page: String(page), pageSize: String(pageSize) })
      const res = await fetch(`/api/customers?${params}`)
      const data = await res.json()
      setCustomers(data.data ?? [])
      setTotal(data.total ?? 0)
    } finally { setLoading(false) }
  }, [search, page])

  useEffect(() => {
    const timer = setTimeout(loadCustomers, 300)
    return () => clearTimeout(timer)
  }, [loadCustomers])

  function openCreate() { setEditCustomer(undefined); setModalOpen(true) }
  function openEdit(customer: Customer) { setEditCustomer(customer); setModalOpen(true) }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      await fetch(`/api/customers/${deleteId}`, { method: 'DELETE' })
      setDeleteId(null)
      loadCustomers()
    } finally { setDeleting(false) }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div>
      <Header
        title="Clientes"
        subtitle={`${total} cliente${total !== 1 ? 's' : ''} cadastrado${total !== 1 ? 's' : ''}`}
        actions={<Button onClick={openCreate}><Plus className="w-4 h-4" />Novo Cliente</Button>}
      />

      <div className="px-4 lg:px-8 py-6 space-y-4 animate-fade-in">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="text" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Buscar por nome, cidade ou telefone..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors" />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          {loading ? <PageLoader /> : customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500 gap-3">
              <Users className="w-12 h-12 text-gray-700" />
              <p className="text-base font-medium">Nenhum cliente encontrado</p>
              <Button onClick={openCreate} size="sm"><Plus className="w-4 h-4" />Criar cliente</Button>
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="sm:hidden divide-y divide-gray-800">
                {customers.map((customer) => (
                  <div key={customer.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm shrink-0">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{customer.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {customer.phone && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Phone className="w-3 h-3" />{customer.phone}
                          </span>
                        )}
                        {customer.address && <span className="text-xs text-gray-500">{customer.address}</span>}
                      </div>
                      <span className="text-xs text-amber-400">{customer._count?.sales ?? 0} compra(s)</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => openEdit(customer)}
                        className="p-2 rounded-lg text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteId(customer.id)}
                        className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <table className="hidden sm:table w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Cliente</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Contato</th>
                    <th className="text-center px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Compras</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Cadastro</th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr key={customer.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{customer.name}</p>
                            {customer.address && <p className="text-xs text-gray-500 truncate max-w-xs">{customer.address}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {customer.phone && <div className="flex items-center gap-1.5 text-xs text-gray-400"><Phone className="w-3.5 h-3.5" />{customer.phone}</div>}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-semibold">
                          {customer._count?.sales ?? 0}
                        </span>
                      </td>
                      <td className="px-6 py-4"><span className="text-sm text-gray-400">{formatDate(customer.createdAt)}</span></td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(customer)} className="p-2 rounded-lg text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => setDeleteId(customer.id)} className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editCustomer ? 'Editar Cliente' : 'Novo Cliente'}>
        <CustomerForm customer={editCustomer} onSuccess={() => { setModalOpen(false); loadCustomers() }} onCancel={() => setModalOpen(false)} />
      </Modal>

      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Remover Cliente" size="sm">
        <p className="text-gray-300 text-sm mb-6">Tem certeza que deseja remover este cliente?</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setDeleteId(null)} className="flex-1">Cancelar</Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting} className="flex-1">Remover</Button>
        </div>
      </Modal>
    </div>
  )
}
