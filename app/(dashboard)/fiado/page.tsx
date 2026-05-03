'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, CheckCircle, Clock, Wallet } from 'lucide-react'
import Header from '@/components/layout/Header'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Fiado {
  id: string
  customerName: string
  amount: number
  description?: string
  status: 'PENDING' | 'COMPLETED'
  paidAt?: string
  createdAt: string
}

function centsToDisplay(cents: number) {
  return (cents / 100).toFixed(2).replace('.', ',')
}

export default function FiadoPage() {
  const [fiados, setFiados] = useState<Fiado[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [amountCents, setAmountCents] = useState(0)
  const [form, setForm] = useState({ customerName: '', description: '' })

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/fiado')
      const d = await res.json()
      setFiados(d.data ?? [])
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function openModal() {
    setForm({ customerName: '', description: '' })
    setAmountCents(0)
    setError('')
    setModalOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/fiado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: amountCents / 100 }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setModalOpen(false)
      load()
    } finally { setSaving(false) }
  }

  async function toggleStatus(fiado: Fiado) {
    const newStatus = fiado.status === 'PENDING' ? 'COMPLETED' : 'PENDING'
    await fetch(`/api/fiado/${fiado.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    load()
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      await fetch(`/api/fiado/${deleteId}`, { method: 'DELETE' })
      setDeleteId(null)
      load()
    } finally { setDeleting(false) }
  }

  const pending = fiados.filter(f => f.status === 'PENDING')
  const completed = fiados.filter(f => f.status === 'COMPLETED')
  const totalPending = pending.reduce((s, f) => s + f.amount, 0)

  return (
    <div>
      <Header
        title="Conta em aberto"
        subtitle={`${pending.length} pendente(s) • Total: ${formatCurrency(totalPending)}`}
        actions={<Button onClick={openModal}><Plus className="w-4 h-4" />Nova Conta</Button>}
      />

      <div className="px-4 lg:px-8 py-6 space-y-6 animate-fade-in">

        {/* Resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gray-900 border border-red-500/20 rounded-2xl p-5">
            <p className="text-sm text-gray-400 mb-1">Total em aberto</p>
            <p className="text-2xl font-bold text-red-400">{formatCurrency(totalPending)}</p>
            <p className="text-xs text-gray-500 mt-1">{pending.length} devedor(es)</p>
          </div>
          <div className="bg-gray-900 border border-emerald-500/20 rounded-2xl p-5">
            <p className="text-sm text-gray-400 mb-1">Total recebido</p>
            <p className="text-2xl font-bold text-emerald-400">{formatCurrency(completed.reduce((s, f) => s + f.amount, 0))}</p>
            <p className="text-xs text-gray-500 mt-1">{completed.length} quitado(s)</p>
          </div>
          <div className="bg-gray-900 border border-amber-500/20 rounded-2xl p-5">
            <p className="text-sm text-gray-400 mb-1">Total geral</p>
            <p className="text-2xl font-bold text-amber-400">{formatCurrency(fiados.reduce((s, f) => s + f.amount, 0))}</p>
            <p className="text-xs text-gray-500 mt-1">{fiados.length} registro(s)</p>
          </div>
        </div>

        {/* Lista */}
        {loading ? <PageLoader /> : fiados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-500">
            <Wallet className="w-12 h-12 text-gray-700" />
            <p className="font-medium">Nenhuma conta em aberto registrada</p>
            <Button onClick={openModal} size="sm"><Plus className="w-4 h-4" />Nova Conta</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Pendentes */}
            {pending.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Pendentes ({pending.length})
                </h2>
                <div className="space-y-2">
                  {pending.map(f => (
                    <div key={f.id} className="bg-gray-900 border border-red-500/20 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white">{f.customerName}</p>
                        {f.description && <p className="text-xs text-gray-400 truncate">{f.description}</p>}
                        <p className="text-xs text-gray-500 mt-0.5">{formatDate(f.createdAt)}</p>
                      </div>
                      <p className="text-lg font-bold text-red-400 shrink-0">{formatCurrency(f.amount)}</p>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => toggleStatus(f)} title="Marcar como pago"
                          className="p-2 rounded-lg text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors">
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button onClick={() => setDeleteId(f.id)}
                          className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Concluídos */}
            {completed.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Quitados ({completed.length})
                </h2>
                <div className="space-y-2">
                  {completed.map(f => (
                    <div key={f.id} className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4 flex items-center justify-between gap-4 opacity-60">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white line-through">{f.customerName}</p>
                        {f.description && <p className="text-xs text-gray-400 truncate">{f.description}</p>}
                        <p className="text-xs text-gray-500 mt-0.5">Quitado em {f.paidAt ? formatDate(f.paidAt) : '-'}</p>
                      </div>
                      <p className="text-lg font-bold text-emerald-400 shrink-0">{formatCurrency(f.amount)}</p>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => toggleStatus(f)} title="Marcar como pendente"
                          className="p-2 rounded-lg text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
                          <Clock className="w-5 h-5" />
                        </button>
                        <button onClick={() => setDeleteId(f.id)}
                          className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal novo fiado */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nova Conta em Aberto">
        <form onSubmit={handleSave} className="space-y-4">
          {error && <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>}
          <Input label="Nome do cliente" value={form.customerName}
            onChange={e => setForm({ ...form, customerName: e.target.value })}
            placeholder="Nome do cliente" required />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-300">Valor (R$)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
              <input type="text" inputMode="numeric"
                value={centsToDisplay(amountCents)}
                onChange={e => setAmountCents(parseInt(e.target.value.replace(/\D/g, '') || '0', 10))}
                required
                className="w-full pl-10 pr-3 py-2.5 rounded-lg text-sm bg-gray-800 border border-gray-600 hover:border-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors" />
            </div>
          </div>
          <Textarea label="Observação (opcional)" value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Ex: comprou no dia 01/05..." />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button type="submit" loading={saving} className="flex-1">Registrar Conta</Button>
          </div>
        </form>
      </Modal>

      {/* Modal confirmar exclusão */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Remover Conta" size="sm">
        <p className="text-gray-300 text-sm mb-6">Tem certeza que deseja remover este registro?</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setDeleteId(null)} className="flex-1">Cancelar</Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting} className="flex-1">Remover</Button>
        </div>
      </Modal>
    </div>
  )
}
