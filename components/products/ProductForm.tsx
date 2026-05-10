'use client'

import { useState } from 'react'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Button from '@/components/ui/Button'
import { Product } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface ProductFormProps {
  product?: Product
  onSuccess: () => void
  onCancel: () => void
}

// Converte centavos para reais formatado
function centsToDisplay(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',')
}

// Input de moeda — digita apenas números, formata automaticamente
function CurrencyInput({
  label,
  value,
  onChange,
  required,
}: {
  label: string
  value: number // em centavos
  onChange: (cents: number) => void
  required?: boolean
}) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '')
    onChange(parseInt(digits || '0', 10))
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-300">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
        <input
          type="text"
          inputMode="numeric"
          value={centsToDisplay(value)}
          onChange={handleChange}
          required={required}
          className="w-full pl-10 pr-3 py-2.5 rounded-lg text-sm bg-gray-800 border border-gray-600 hover:border-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors"
        />
      </div>
    </div>
  )
}

export default function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState(product?.name ?? '')
  const [category, setCategory] = useState(product?.category ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [quantity, setQuantity] = useState(product?.quantity ?? 0)
  const [lowStockThreshold, setLowStockThreshold] = useState(product?.lowStockThreshold ?? 5)
  // preços em centavos para evitar problemas de float
  const [costCents, setCostCents] = useState(Math.round((product?.costPrice ?? 0) * 100))
  const [priceCents, setPriceCents] = useState(Math.round((product?.price ?? 0) * 100))

  const costPrice = costCents / 100
  const price = priceCents / 100
  const margin = costPrice > 0 ? ((price - costPrice) / costPrice) * 100 : 0
  const profit = price - costPrice

  const marginColor =
    margin > 30
      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      : margin > 0
      ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      : 'text-red-400 bg-red-500/10 border-red-500/20'

  const MarginIcon = margin > 0 ? TrendingUp : margin < 0 ? TrendingDown : Minus

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const url = product ? `/api/products/${product.id}` : '/api/products'
      const method = product ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, costPrice, price, quantity: Number(quantity), lowStockThreshold: Number(lowStockThreshold), category }),
      })

      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao salvar produto'); return }
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
        label="Nome do produto"
        value={name}
        onChange={e => { setName(e.target.value); setError('') }}
        placeholder="Smartphone Samsung"
        required
      />

      <Input
        label="Categoria"
        value={category}
        onChange={e => { setCategory(e.target.value); setError('') }}
        placeholder="Eletrônicos"
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <CurrencyInput label="Preço de compra (R$)" value={costCents} onChange={setCostCents} />
        <CurrencyInput label="Preço de venda (R$)" value={priceCents} onChange={setPriceCents} required />
      </div>

      {/* Margem de lucro */}
      {(costCents > 0 || priceCents > 0) && (
        <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${marginColor}`}>
          <div className="flex items-center gap-2">
            <MarginIcon className="w-4 h-4" />
            <span className="text-sm font-medium">Margem de lucro</span>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">{margin.toFixed(1)}%</p>
            <p className="text-xs opacity-75">
              {profit >= 0 ? '+' : ''}{formatCurrency(profit)} por unidade
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Quantidade em estoque"
          type="number"
          min="0"
          value={quantity === 0 ? '' : quantity}
          onChange={e => setQuantity(Number(e.target.value) || 0)}
          placeholder="0"
          required
        />
        <Input
          label="Alerta de estoque baixo"
          type="number"
          min="0"
          value={lowStockThreshold === 0 ? '' : lowStockThreshold}
          onChange={e => setLowStockThreshold(Number(e.target.value) || 0)}
          placeholder="5"
        />
      </div>

      <Textarea
        label="Descrição (opcional)"
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Descrição detalhada do produto..."
      />

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancelar</Button>
        <Button type="submit" loading={loading} className="flex-1">
          {product ? 'Salvar alterações' : 'Criar produto'}
        </Button>
      </div>
    </form>
  )
}
