'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import Header from '@/components/layout/Header'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Edit2, Trash2 } from 'lucide-react'

const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'Dinheiro', CREDIT_CARD: 'Cartão Crédito', DEBIT_CARD: 'Cartão Débito',
  PIX: 'PIX', BANK_TRANSFER: 'Transferência', OTHER: 'Outro',
}
const PIE_COLORS = ['#f59e0b','#3b82f6','#10b981','#8b5cf6','#ef4444','#f97316']

interface ReportData {
  revenue: number; totalSales: number; totalExpenses: number; profit: number
  topProducts: any[]; topCustomers: any[]; paymentMethods: any[]; salesByDay: any[]
}

interface ProductEditForm { name: string; price: string; category: string; quantity: string }
interface CustomerEditForm { name: string; phone: string; address: string }

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
  const [from, setFrom] = useState(firstDay)
  const [to, setTo] = useState(today.toISOString().split('T')[0])

  // Product edit state
  const [productModal, setProductModal] = useState(false)
  const [editProduct, setEditProduct] = useState<any>(null)
  const [productForm, setProductForm] = useState<ProductEditForm>({ name: '', price: '', category: '', quantity: '' })
  const [savingProduct, setSavingProduct] = useState(false)
  const [productError, setProductError] = useState('')
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null)
  const [deletingProduct, setDeletingProduct] = useState(false)

  // Customer edit state
  const [customerModal, setCustomerModal] = useState(false)
  const [editCustomer, setEditCustomer] = useState<any>(null)
  const [customerForm, setCustomerForm] = useState<CustomerEditForm>({ name: '', phone: '', address: '' })
  const [savingCustomer, setSavingCustomer] = useState(false)
  const [customerError, setCustomerError] = useState('')
  const [deleteCustomerId, setDeleteCustomerId] = useState<string | null>(null)
  const [deletingCustomer, setDeletingCustomer] = useState(false)

  async function loadReport() {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports?from=${from}&to=${to}`)
      const d = await res.json()
      setData(d.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { loadReport() }, [from, to])

  function openEditProduct(p: any) {
    setEditProduct(p)
    setProductForm({
      name: p.product?.name ?? '',
      price: String(p.product?.price ?? ''),
      category: p.product?.category ?? '',
      quantity: String(p.product?.quantity ?? ''),
    })
    setProductError('')
    setProductModal(true)
  }

  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault()
    if (!editProduct?.productId) return
    setSavingProduct(true)
    setProductError('')
    try {
      const res = await fetch(`/api/products/${editProduct.productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: productForm.name,
          price: parseFloat(productForm.price),
          category: productForm.category,
          quantity: parseInt(productForm.quantity),
        }),
      })
      const d = await res.json()
      if (!res.ok) { setProductError(d.error); return }
      setProductModal(false)
      loadReport()
    } finally { setSavingProduct(false) }
  }

  function openEditCustomer(c: any) {
    setEditCustomer(c)
    setCustomerForm({
      name: c.customer?.name ?? '',
      phone: c.customer?.phone ?? '',
      address: c.customer?.address ?? '',
    })
    setCustomerError('')
    setCustomerModal(true)
  }

  async function handleDeleteProduct() {
    if (!deleteProductId) return
    setDeletingProduct(true)
    try {
      await fetch(`/api/products/${deleteProductId}`, { method: 'DELETE' })
      setDeleteProductId(null)
      loadReport()
    } finally { setDeletingProduct(false) }
  }

  async function handleDeleteCustomer() {
    if (!deleteCustomerId) return
    setDeletingCustomer(true)
    try {
      await fetch(`/api/customers/${deleteCustomerId}`, { method: 'DELETE' })
      setDeleteCustomerId(null)
      loadReport()
    } finally { setDeletingCustomer(false) }
  }

  async function handleSaveCustomer(e: React.FormEvent) {
    e.preventDefault()
    if (!editCustomer?.customerId) return
    setSavingCustomer(true)
    setCustomerError('')
    try {
      const res = await fetch(`/api/customers/${editCustomer.customerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: customerForm.name,
          phone: customerForm.phone || null,
          address: customerForm.address || null,
        }),
      })
      const d = await res.json()
      if (!res.ok) { setCustomerError(d.error); return }
      setCustomerModal(false)
      loadReport()
    } finally { setSavingCustomer(false) }
  }

  const summaryCards = data ? [
    { label: 'Receita', value: formatCurrency(data.revenue), icon: DollarSign, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Despesas', value: formatCurrency(data.totalExpenses), icon: TrendingDown, color: 'text-rose-400', bg: 'bg-rose-500/10' },
    { label: 'Lucro', value: formatCurrency(data.profit), icon: TrendingUp, color: data.profit >= 0 ? 'text-emerald-400' : 'text-red-400', bg: data.profit >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10' },
    { label: 'Vendas', value: data.totalSales, icon: ShoppingCart, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  ] : []

  return (
    <div>
      <Header title="Relatórios" subtitle="Análise de desempenho do negócio" />

      <div className="px-8 py-6 space-y-6 animate-fade-in">
        {/* Date filters */}
        <div className="flex items-center gap-4 bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">De</label>
              <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">Até</label>
              <input type="date" value={to} onChange={e => setTo(e.target.value)}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50" />
            </div>
          </div>
          {[
            { label: 'Este mês', fn: () => { setFrom(firstDay); setTo(today.toISOString().split('T')[0]) } },
            { label: 'Últimos 7 dias', fn: () => { const d = new Date(); d.setDate(d.getDate()-7); setFrom(d.toISOString().split('T')[0]); setTo(today.toISOString().split('T')[0]) } },
            { label: 'Este ano', fn: () => { setFrom(`${today.getFullYear()}-01-01`); setTo(today.toISOString().split('T')[0]) } },
          ].map(b => (
            <Button key={b.label} variant="outline" size="sm" onClick={b.fn}>{b.label}</Button>
          ))}
        </div>

        {loading ? <PageLoader /> : !data ? null : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {summaryCards.map((c) => (
                <div key={c.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-gray-400">{c.label}</p>
                    <div className={`p-2 rounded-xl ${c.bg}`}><c.icon className={`w-5 h-5 ${c.color}`} /></div>
                  </div>
                  <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                </div>
              ))}
            </div>

            {/* Sales chart */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-base font-semibold text-white mb-4">Vendas por Dia</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data.salesByDay} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={v => new Date(v+'T12:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => `R$${v>=1000?(v/1000).toFixed(0)+'k':v}`} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={55} />
                  <Tooltip formatter={(v: number) => [formatCurrency(v), 'Receita']} contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '12px' }} labelStyle={{ color: '#9ca3af' }} />
                  <Bar dataKey="total" fill="#f59e0b" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Top Products */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-base font-semibold text-white mb-4">Produtos mais vendidos</h3>
                {data.topProducts.length === 0 ? <p className="text-gray-500 text-sm text-center py-4">Sem dados</p> : (
                  <div className="space-y-3">
                    {data.topProducts.map((p, i) => (
                      <div key={p.productId} className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center shrink-0">{i+1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{p.product?.name ?? 'Produto'}</p>
                          <p className="text-xs text-gray-500">{p._sum.quantity} unidades</p>
                        </div>
                        <span className="text-sm font-semibold text-amber-400">{formatCurrency(p._sum.price * p._sum.quantity)}</span>
                        {p.productId && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => openEditProduct(p)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                              title="Editar produto">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setDeleteProductId(p.productId)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Excluir produto">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top Customers */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-base font-semibold text-white mb-4">Clientes que mais compram</h3>
                {data.topCustomers.length === 0 ? <p className="text-gray-500 text-sm text-center py-4">Sem dados</p> : (
                  <div className="space-y-3">
                    {data.topCustomers.map((c, i) => (
                      <div key={c.customerId} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs shrink-0">
                          {c.customer?.name?.charAt(0) ?? '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{c.customer?.name ?? 'Cliente'}</p>
                          <p className="text-xs text-gray-500">{c._count} compra(s)</p>
                        </div>
                        <span className="text-sm font-semibold text-emerald-400">{formatCurrency(c._sum.total)}</span>
                        {c.customerId && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => openEditCustomer(c)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                              title="Editar cliente">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setDeleteCustomerId(c.customerId)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Excluir cliente">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment methods */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <h3 className="text-base font-semibold text-white mb-4">Formas de Pagamento</h3>
                {data.paymentMethods.length === 0 ? <p className="text-gray-500 text-sm text-center py-4">Sem dados</p> : (
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={data.paymentMethods} dataKey="_count" nameKey="paymentMethod" cx="50%" cy="50%" outerRadius={65} paddingAngle={3}>
                        {data.paymentMethods.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v, name) => [v, PAYMENT_LABELS[name as string] ?? name]} contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '12px' }} />
                      <Legend formatter={(v) => PAYMENT_LABELS[v] ?? v} wrapperStyle={{ fontSize: '11px', color: '#9ca3af' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal editar produto */}
      <Modal isOpen={productModal} onClose={() => setProductModal(false)} title="Editar Produto">
        <form onSubmit={handleSaveProduct} className="space-y-4">
          {productError && <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{productError}</div>}
          <Input label="Nome" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Preço (R$)" type="number" step="0.01" min="0" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} required />
            <Input label="Quantidade" type="number" min="0" value={productForm.quantity} onChange={e => setProductForm({ ...productForm, quantity: e.target.value })} required />
          </div>
          <Input label="Categoria" value={productForm.category} onChange={e => setProductForm({ ...productForm, category: e.target.value })} required />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setProductModal(false)} className="flex-1">Cancelar</Button>
            <Button type="submit" loading={savingProduct} className="flex-1">Salvar</Button>
          </div>
        </form>
      </Modal>

      {/* Modal confirmar exclusão produto */}
      <Modal isOpen={!!deleteProductId} onClose={() => setDeleteProductId(null)} title="Excluir Produto" size="sm">
        <p className="text-gray-300 text-sm mb-6">Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setDeleteProductId(null)} className="flex-1">Cancelar</Button>
          <Button variant="danger" onClick={handleDeleteProduct} loading={deletingProduct} className="flex-1">Excluir</Button>
        </div>
      </Modal>

      {/* Modal confirmar exclusão cliente */}
      <Modal isOpen={!!deleteCustomerId} onClose={() => setDeleteCustomerId(null)} title="Excluir Cliente" size="sm">
        <p className="text-gray-300 text-sm mb-6">Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setDeleteCustomerId(null)} className="flex-1">Cancelar</Button>
          <Button variant="danger" onClick={handleDeleteCustomer} loading={deletingCustomer} className="flex-1">Excluir</Button>
        </div>
      </Modal>

      {/* Modal editar cliente */}
      <Modal isOpen={customerModal} onClose={() => setCustomerModal(false)} title="Editar Cliente">
        <form onSubmit={handleSaveCustomer} className="space-y-4">
          {customerError && <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{customerError}</div>}
          <Input label="Nome" value={customerForm.name} onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })} required />
          <Input label="Telefone" value={customerForm.phone} onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })} placeholder="(opcional)" />
          <Input label="Endereço" value={customerForm.address} onChange={e => setCustomerForm({ ...customerForm, address: e.target.value })} placeholder="(opcional)" />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setCustomerModal(false)} className="flex-1">Cancelar</Button>
            <Button type="submit" loading={savingCustomer} className="flex-1">Salvar</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
