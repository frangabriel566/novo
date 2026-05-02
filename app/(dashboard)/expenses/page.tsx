'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Edit2, Trash2, DollarSign } from 'lucide-react'
import Header from '@/components/layout/Header'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { formatCurrency, formatDate } from '@/lib/utils'

const EXPENSE_CATEGORIES = ['Aluguel','Salários','Marketing','Fornecedores','Utilities','Transporte','Equipamentos','Software','Outros']

interface Expense {
  id: string; description: string; amount: number; category: string
  date: string; user: { name: string }; createdAt: string
}

interface ExpenseForm {
  description: string; amount: string; category: string; date: string
}

const emptyForm: ExpenseForm = { description: '', amount: '', category: '', date: new Date().toISOString().split('T')[0] }

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [total, setTotal] = useState(0)
  const [totalAmount, setTotalAmount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editExpense, setEditExpense] = useState<Expense | undefined>()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<ExpenseForm>(emptyForm)
  const pageSize = 10

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/expenses?search=${search}&page=${page}&pageSize=${pageSize}`)
      const data = await res.json()
      setExpenses(data.data ?? [])
      setTotal(data.total ?? 0)
      setTotalAmount(data.totalAmount ?? 0)
    } finally { setLoading(false) }
  }, [search, page])

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t) }, [load])

  function openCreate() {
    setEditExpense(undefined); setForm(emptyForm); setError(''); setModalOpen(true)
  }
  function openEdit(e: Expense) {
    setEditExpense(e)
    setForm({ description: e.description, amount: String(e.amount), category: e.category, date: e.date.split('T')[0] })
    setError(''); setModalOpen(true)
  }

  async function handleSave(ev: React.FormEvent) {
    ev.preventDefault(); setSaving(true); setError('')
    try {
      const url = editExpense ? `/api/expenses/${editExpense.id}` : '/api/expenses'
      const method = editExpense ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }) })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setModalOpen(false); load()
    } finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!deleteId) return; setDeleting(true)
    try { await fetch(`/api/expenses/${deleteId}`, { method: 'DELETE' }); setDeleteId(null); load() }
    finally { setDeleting(false) }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div>
      <Header title="Despesas" subtitle={`Total no período: ${formatCurrency(totalAmount)}`}
        actions={<Button onClick={openCreate}><Plus className="w-4 h-4" />Nova Despesa</Button>} />

      <div className="px-8 py-6 space-y-4 animate-fade-in">
        {/* Summary card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total de Despesas', value: formatCurrency(totalAmount), color: 'rose' },
            { label: 'Registros', value: total, color: 'blue' },
            { label: 'Média por despesa', value: total > 0 ? formatCurrency(totalAmount / total) : 'R$ 0,00', color: 'amber' },
          ].map((s) => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <p className="text-sm text-gray-400">{s.label}</p>
              <p className="text-2xl font-bold text-white mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Buscar despesa..." className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500" />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          {loading ? <PageLoader /> : expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-500">
              <DollarSign className="w-12 h-12 text-gray-700" />
              <p className="font-medium">Nenhuma despesa registrada</p>
              <Button onClick={openCreate} size="sm"><Plus className="w-4 h-4" />Registrar despesa</Button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Descrição','Categoria','Data','Valor','Registrado por','Ações'].map((h) => (
                    <th key={h} className={`px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider ${h === 'Valor' ? 'text-right' : h === 'Ações' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-white">{expense.description}</td>
                    <td className="px-6 py-4"><span className="px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 border border-rose-500/20 text-rose-400">{expense.category}</span></td>
                    <td className="px-6 py-4 text-sm text-gray-400">{formatDate(expense.date)}</td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-rose-400">{formatCurrency(expense.amount)}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{expense.user.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(expense)} className="p-2 rounded-lg text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteId(expense.id)} className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
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
            <p className="text-sm text-gray-400">Mostrando {(page-1)*pageSize+1}–{Math.min(page*pageSize,total)} de {total}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page<=1} onClick={() => setPage(p=>p-1)}>Anterior</Button>
              <Button variant="outline" size="sm" disabled={page>=totalPages} onClick={() => setPage(p=>p+1)}>Próximo</Button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editExpense ? 'Editar Despesa' : 'Nova Despesa'}>
        <form onSubmit={handleSave} className="space-y-4">
          {error && <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>}
          <Input label="Descrição" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} placeholder="Ex: Aluguel do escritório" required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Valor (R$)" type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} required />
            <Input label="Data" type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} required />
          </div>
          <Select label="Categoria" value={form.category} onChange={(e) => setForm({...form, category: e.target.value})} options={EXPENSE_CATEGORIES.map(c=>({value:c,label:c}))} placeholder="Selecione..." required />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button type="submit" loading={saving} className="flex-1">{editExpense ? 'Salvar' : 'Criar'}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Remover Despesa" size="sm">
        <p className="text-gray-300 text-sm mb-6">Tem certeza que deseja remover esta despesa?</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setDeleteId(null)} className="flex-1">Cancelar</Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting} className="flex-1">Remover</Button>
        </div>
      </Modal>
    </div>
  )
}
