'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, UserCog, Shield, User } from 'lucide-react'
import Header from '@/components/layout/Header'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { formatDate } from '@/lib/utils'

interface AppUser { id: string; name: string; email: string; role: 'USER'|'ADMIN'; createdAt: string; _count: { sales: number } }

const emptyForm = { name: '', email: '', password: '', role: 'USER' as 'USER'|'ADMIN' }

export default function UsersPage() {
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editUser, setEditUser] = useState<AppUser | undefined>()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)

  async function load() {
    setLoading(true)
    try { const res = await fetch('/api/users'); const d = await res.json(); setUsers(d.data ?? []) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function openCreate() { setEditUser(undefined); setForm(emptyForm); setError(''); setModalOpen(true) }
  function openEdit(u: AppUser) { setEditUser(u); setForm({ name: u.name, email: u.email, password: '', role: u.role }); setError(''); setModalOpen(true) }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const payload: Record<string,string> = { name: form.name, email: form.email, role: form.role }
      if (form.password) payload.password = form.password
      const url = editUser ? `/api/users/${editUser.id}` : '/api/users'
      const method = editUser ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setModalOpen(false); load()
    } finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!deleteId) return; setDeleting(true)
    try { await fetch(`/api/users/${deleteId}`, { method: 'DELETE' }); setDeleteId(null); load() }
    finally { setDeleting(false) }
  }

  return (
    <div>
      <Header title="Usuários" subtitle={`${users.length} usuário(s) cadastrado(s)`}
        actions={<Button onClick={openCreate}><Plus className="w-4 h-4" />Novo Usuário</Button>} />

      <div className="px-4 lg:px-8 py-6 animate-fade-in">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          {loading ? <PageLoader /> : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray-500">
              <UserCog className="w-12 h-12 text-gray-700" />
              <p className="font-medium">Nenhum usuário encontrado</p>
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="sm:hidden divide-y divide-gray-800">
                {users.map((u) => (
                  <div key={u.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-sm shrink-0">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{u.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${u.role === 'ADMIN' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                          {u.role === 'ADMIN' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                          {u.role === 'ADMIN' ? 'Admin' : 'Usuário'}
                        </span>
                        <span className="text-xs text-gray-500">{u._count.sales} venda(s)</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => openEdit(u)}
                        className="p-2 rounded-lg text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteId(u.id)}
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
                    {['Usuário','Login','Perfil','Vendas','Cadastro','Ações'].map(h => (
                      <th key={h} className={`px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider ${h==='Ações'?'text-right':'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-sm">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-white">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${u.role === 'ADMIN' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                          {u.role === 'ADMIN' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                          {u.role === 'ADMIN' ? 'Admin' : 'Usuário'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">{u._count.sales}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">{formatDate(u.createdAt)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(u)} className="p-2 rounded-lg text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => setDeleteId(u.id)} className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editUser ? 'Editar Usuário' : 'Novo Usuário'}>
        <form onSubmit={handleSave} className="space-y-4">
          {error && <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>}
          <Input label="Nome" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Nome completo" required />
          <Input label="Usuário" type="text" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="Ex: carvalho" required={!editUser} />
          <Input label={editUser ? 'Nova senha (deixe em branco para manter)' : 'Senha'} type="password"
            value={form.password} onChange={e => setForm({...form, password: e.target.value})}
            placeholder={editUser ? '••••••' : 'Mínimo 6 caracteres'} required={!editUser} />
          <Select label="Perfil" value={form.role} onChange={e => setForm({...form, role: e.target.value as 'USER'|'ADMIN'})}
            options={[{value:'USER',label:'Usuário'},{value:'ADMIN',label:'Administrador'}]} />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="flex-1">Cancelar</Button>
            <Button type="submit" loading={saving} className="flex-1">{editUser ? 'Salvar' : 'Criar'}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Remover Usuário" size="sm">
        <p className="text-gray-300 text-sm mb-6">Tem certeza que deseja remover este usuário?</p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setDeleteId(null)} className="flex-1">Cancelar</Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting} className="flex-1">Remover</Button>
        </div>
      </Modal>
    </div>
  )
}
