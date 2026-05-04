'use client'

import { useState, useEffect } from 'react'
import { User, Lock, Save, Wallet } from 'lucide-react'
import Header from '@/components/layout/Header'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { formatDate } from '@/lib/utils'

interface Profile { id: string; name: string; email: string; role: string; createdAt: string }

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingInfo, setSavingInfo] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [infoSuccess, setInfoSuccess] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [infoError, setInfoError] = useState('')
  const [pwError, setPwError] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [saldoAjuste, setSaldoAjuste] = useState('0')
  const [savingSaldo, setSavingSaldo] = useState(false)
  const [saldoSuccess, setSaldoSuccess] = useState(false)
  const [saldoError, setSaldoError] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(r => r.json()),
      fetch('/api/settings').then(r => r.json()),
    ]).then(([me, setting]) => {
      if (me.data) { setProfile(me.data); setName(me.data.name); setEmail(me.data.email) }
      setSaldoAjuste(String(setting.value ?? 0))
    }).finally(() => setLoading(false))
  }, [])

  async function saveInfo(e: React.FormEvent) {
    e.preventDefault(); setSavingInfo(true); setInfoError(''); setInfoSuccess(false)
    try {
      const res = await fetch(`/api/users/${profile!.id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name, email }) })
      const data = await res.json()
      if (!res.ok) { setInfoError(data.error); return }
      setProfile(p => p ? { ...p, name, email } : p)
      setInfoSuccess(true)
      setTimeout(() => setInfoSuccess(false), 3000)
    } finally { setSavingInfo(false) }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault(); setPwError(''); setPwSuccess(false)
    if (newPw !== confirmPw) { setPwError('As senhas não coincidem'); return }
    if (newPw.length < 6) { setPwError('Senha deve ter pelo menos 6 caracteres'); return }
    setSavingPassword(true)
    try {
      const res = await fetch(`/api/users/${profile!.id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ password: newPw }) })
      const data = await res.json()
      if (!res.ok) { setPwError(data.error); return }
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
      setPwSuccess(true)
      setTimeout(() => setPwSuccess(false), 3000)
    } finally { setSavingPassword(false) }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-gray-700 border-t-amber-500 rounded-full animate-spin" /></div>

  return (
    <div>
      <Header title="Meu Perfil" subtitle="Gerencie suas informações pessoais" />

      <div className="px-8 py-6 max-w-2xl space-y-6 animate-fade-in">
        {/* Avatar card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-amber-500/20 border-2 border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-3xl shrink-0">
            {profile?.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{profile?.name}</h2>
            <p className="text-gray-400 text-sm">{profile?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${profile?.role === 'ADMIN' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                {profile?.role === 'ADMIN' ? '👑 Administrador' : '👤 Usuário'}
              </span>
              <span className="text-xs text-gray-500">Membro desde {profile ? formatDate(profile.createdAt) : ''}</span>
            </div>
          </div>
        </div>

        {/* Info form */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-amber-400" /> Informações Pessoais
          </h3>
          <form onSubmit={saveInfo} className="space-y-4">
            {infoError && <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{infoError}</div>}
            {infoSuccess && <div className="px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400">✓ Informações atualizadas com sucesso!</div>}
            <Input label="Nome completo" value={name} onChange={e => setName(e.target.value)} required />
            <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            <Button type="submit" loading={savingInfo}>
              <Save className="w-4 h-4" /> Salvar informações
            </Button>
          </form>
        </div>

        {/* Saldo de ajuste */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h3 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-amber-400" /> Ajuste de Saldo
          </h3>
          <p className="text-xs text-gray-500 mb-4">Valor extra somado ao saldo da conta (ex: dinheiro em caixa não registrado como venda).</p>
          <form onSubmit={async (e) => {
            e.preventDefault(); setSavingSaldo(true); setSaldoError(''); setSaldoSuccess(false)
            try {
              const res = await fetch('/api/settings', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ value: saldoAjuste }) })
              const d = await res.json()
              if (!res.ok) { setSaldoError(d.error); return }
              setSaldoSuccess(true)
              setTimeout(() => setSaldoSuccess(false), 3000)
            } finally { setSavingSaldo(false) }
          }} className="space-y-4">
            {saldoError && <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{saldoError}</div>}
            {saldoSuccess && <div className="px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400">✓ Ajuste salvo com sucesso!</div>}
            <Input label="Valor de ajuste (R$)" type="number" step="0.01" value={saldoAjuste} onChange={e => setSaldoAjuste(e.target.value)} placeholder="Ex: 6.00" />
            <Button type="submit" loading={savingSaldo}>
              <Save className="w-4 h-4" /> Salvar ajuste
            </Button>
          </form>
        </div>

        {/* Password form */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-400" /> Alterar Senha
          </h3>
          <form onSubmit={savePassword} className="space-y-4">
            {pwError && <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{pwError}</div>}
            {pwSuccess && <div className="px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400">✓ Senha alterada com sucesso!</div>}
            <Input label="Nova senha" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Mínimo 6 caracteres" required />
            <Input label="Confirmar nova senha" type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Repita a nova senha" required />
            <Button type="submit" loading={savingPassword} variant="secondary">
              <Lock className="w-4 h-4" /> Alterar senha
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
