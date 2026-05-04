'use client'

import { useState } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { Customer, CustomerFormData } from '@/types'

interface CustomerFormProps {
  customer?: Customer
  onSuccess: () => void
  onCancel: () => void
}

export default function CustomerForm({ customer, onSuccess, onCancel }: CustomerFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<CustomerFormData>({
    name: customer?.name ?? '',
    phone: customer?.phone ?? '',
    address: customer?.address ?? '',
  })

  function handleChange(field: keyof CustomerFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const url = customer ? `/api/customers/${customer.id}` : '/api/customers'
      const method = customer ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erro ao salvar cliente')
        return
      }

      onSuccess()
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {error}
        </div>
      )}

      <Input
        label="Nome completo"
        value={form.name}
        onChange={(e) => handleChange('name', e.target.value)}
        placeholder="WYLLYAM ALVES"
        required
      />

      <Input
        label="Telefone"
        type="tel"
        value={form.phone}
        onChange={(e) => handleChange('phone', e.target.value)}
        placeholder="(11) 99999-9999"
      />

      <Input
        label="Cidade"
        value={form.address}
        onChange={(e) => handleChange('address', e.target.value)}
        placeholder="Teresina"
      />

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" loading={loading} className="flex-1">
          {customer ? 'Salvar alterações' : 'Criar cliente'}
        </Button>
      </div>
    </form>
  )
}
