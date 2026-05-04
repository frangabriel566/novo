'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Package, Search } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import { Customer, Product, SaleItemInput } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { useRouter } from 'next/navigation'

const PAYMENT_OPTIONS = [
  { value: 'CASH', label: 'Dinheiro' },
  { value: 'PIX', label: 'PIX' },
  { value: 'CREDIT_CARD', label: 'Cartão de Crédito' },
  { value: 'DEBIT_CARD', label: 'Cartão de Débito' },
  { value: 'BANK_TRANSFER', label: 'Transferência' },
  { value: 'OTHER', label: 'Outro' },
]

function centsToDisplay(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',')
}

function SearchableSelect({
  label,
  placeholder,
  items,
  onSelect,
  renderItem,
  renderSelected,
}: {
  label: string
  placeholder: string
  items: { id: string; primary: string; secondary?: string }[]
  onSelect: (id: string) => void
  renderItem?: (item: { id: string; primary: string; secondary?: string }) => React.ReactNode
  renderSelected?: (item: { id: string; primary: string; secondary?: string }) => string
}) {
  const [search, setSearch] = useState('')
  const [show, setShow] = useState(false)
  const [selected, setSelected] = useState<{ id: string; primary: string; secondary?: string } | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setShow(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = items.filter(i =>
    i.primary.toLowerCase().includes(search.toLowerCase()) ||
    (i.secondary && i.secondary.toLowerCase().includes(search.toLowerCase()))
  )

  function pick(item: { id: string; primary: string; secondary?: string }) {
    setSelected(item)
    setSearch(renderSelected ? renderSelected(item) : item.primary)
    setShow(false)
    onSelect(item.id)
  }

  return (
    <div className="flex flex-col gap-1.5" ref={ref}>
      <label className="text-sm font-medium text-gray-300">{label}</label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setSelected(null); onSelect(''); setShow(true) }}
          onFocus={() => setShow(true)}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2.5 rounded-lg text-sm bg-gray-800 border border-gray-600 hover:border-gray-500 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors"
        />
      {show && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-20 max-h-52 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-500">Nenhum resultado</p>
          ) : (
            filtered.map(item => (
              <button key={item.id} type="button" onClick={() => pick(item)}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-700 transition-colors border-b border-gray-700/50 last:border-0">
                {renderItem ? renderItem(item) : (
                  <>
                    <p className="text-sm font-medium text-white">{item.primary}</p>
                    {item.secondary && <p className="text-xs text-gray-400">{item.secondary}</p>}
                  </>
                )}
              </button>
            ))
          )}
        </div>
      )}
      </div>
    </div>
  )
}

export default function SaleForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [customerId, setCustomerId] = useState('')
  const [items, setItems] = useState<SaleItemInput[]>([])
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<'COMPLETED' | 'PENDING'>('COMPLETED')
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [selectedProductId, setSelectedProductId] = useState('')
  const [selectedQty, setSelectedQty] = useState(1)
  const [discountCents, setDiscountCents] = useState(0)
  const [productSearch, setProductSearch] = useState('')
  const [showProductList, setShowProductList] = useState(false)
  const productSearchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([fetch('/api/customers?pageSize=200'), fetch('/api/products?pageSize=200')])
      .then(([c, p]) => Promise.all([c.json(), p.json()]))
      .then(([c, p]) => { setCustomers(c.data ?? []); setProducts(p.data ?? []) })
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (productSearchRef.current && !productSearchRef.current.contains(e.target as Node)) {
        setShowProductList(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discount = discountCents / 100
  const total = Math.max(0, subtotal - discount)

  const availableProducts = products
    .map(p => {
      const inCart = items.find(i => i.productId === p.id)
      return { ...p, quantity: p.quantity - (inCart?.quantity ?? 0) }
    })
    .filter(p => p.quantity > 0)

  const filteredProducts = availableProducts.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(productSearch.toLowerCase()))
  )

  const selectedProduct = products.find(p => p.id === selectedProductId)
  const selectedInCart = items.find(i => i.productId === selectedProductId)
  const maxQty = (selectedProduct?.quantity ?? 0) - (selectedInCart?.quantity ?? 0)

  function selectProduct(product: typeof availableProducts[0]) {
    setSelectedProductId(product.id)
    setProductSearch(product.name)
    setSelectedQty(1)
    setShowProductList(false)
  }

  function addItem() {
    if (!selectedProductId) return
    const product = products.find((p) => p.id === selectedProductId)
    if (!product) return
    const remaining = product.quantity - (items.find(i => i.productId === selectedProductId)?.quantity ?? 0)
    if (selectedQty > remaining) return
    const existing = items.find((i) => i.productId === selectedProductId)
    if (existing) {
      setItems(prev => prev.map(i => i.productId === selectedProductId ? { ...i, quantity: i.quantity + selectedQty } : i))
    } else {
      setItems(prev => [...prev, { productId: product.id, quantity: selectedQty, price: product.price, product }])
    }
    setSelectedProductId('')
    setProductSearch('')
    setSelectedQty(1)
  }

  function removeItem(productId: string) { setItems(prev => prev.filter(i => i.productId !== productId)) }
  function updateItemQty(productId: string, qty: number) { setItems(prev => prev.map(i => i.productId === productId ? { ...i, quantity: qty } : i)) }

  function handleDiscountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '')
    setDiscountCents(parseInt(digits || '0', 10))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!customerId) { setError('Selecione um cliente'); return }
    if (items.length === 0) { setError('Adicione pelo menos um produto'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/sales', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          items: items.map(({ productId, quantity, price }) => ({ productId, quantity, price })),
          notes, status, paymentMethod, discount,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao criar venda'); return }
      router.push('/sales'); router.refresh()
    } catch { setError('Erro de conexão. Tente novamente.') }
    finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>}

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-6 space-y-4">
        <h2 className="text-base font-semibold text-white">Informações da Venda</h2>

        {/* Customer searchable */}
        <div className="relative">
          <SearchableSelect
            label="Cliente"
            placeholder="Buscar cliente..."
            items={customers.map(c => ({ id: c.id, primary: c.name, secondary: c.phone ?? undefined }))}
            onSelect={id => { setCustomerId(id); setError('') }}
            renderItem={item => (
              <>
                <p className="text-sm font-medium text-white">{item.primary}</p>
                {item.secondary && <p className="text-xs text-gray-400">{item.secondary}</p>}
              </>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select label="Status" value={status} onChange={e => setStatus(e.target.value as 'COMPLETED' | 'PENDING')}
            options={[{ value: 'COMPLETED', label: 'Concluída' }, { value: 'PENDING', label: 'Pendente' }]} />
          <Select label="Forma de Pagamento" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} options={PAYMENT_OPTIONS} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-300">Desconto (R$)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
            <input type="text" inputMode="numeric" value={centsToDisplay(discountCents)} onChange={handleDiscountChange}
              className="w-full pl-10 pr-3 py-2.5 rounded-lg text-sm bg-gray-800 border border-gray-600 hover:border-gray-500 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors" />
          </div>
        </div>

        <Textarea label="Observações (opcional)" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Informações adicionais..." />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 sm:p-6 space-y-4">
        <h2 className="text-base font-semibold text-white">Adicionar Produtos</h2>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Searchable product selector */}
          <div className="flex-1 relative" ref={productSearchRef}>
            <label className="text-sm font-medium text-gray-300 mb-1.5 block">Produto</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              <input
                type="text"
                value={productSearch}
                onChange={e => { setProductSearch(e.target.value); setSelectedProductId(''); setShowProductList(true) }}
                onFocus={() => setShowProductList(true)}
                placeholder="Buscar produto..."
                className="w-full pl-9 pr-3 py-2.5 rounded-lg text-sm bg-gray-800 border border-gray-600 hover:border-gray-500 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-colors"
              />
            </div>
            {showProductList && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-20 max-h-52 overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-gray-500">Nenhum produto encontrado</p>
                ) : (
                  filteredProducts.map(p => (
                    <button key={p.id} type="button" onClick={() => selectProduct(p)}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-700 transition-colors border-b border-gray-700/50 last:border-0">
                      <p className="text-sm font-medium text-white">{p.name}</p>
                      <p className="text-xs text-gray-400">{formatCurrency(p.price)} • {p.quantity} em estoque</p>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3 items-end">
            <div className="w-24">
              <Input label="Qtd" type="number" min={1} max={maxQty || 99} value={selectedQty}
                onChange={e => setSelectedQty(Number(e.target.value))} placeholder="Qtd" />
            </div>
            <Button type="button" onClick={addItem} disabled={!selectedProductId} className="shrink-0 h-[42px]">
              <Plus className="w-4 h-4" />Adicionar
            </Button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-500 gap-2">
            <Package className="w-10 h-10 text-gray-700" />
            <p className="text-sm">Nenhum produto adicionado</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.productId} className="flex items-center gap-3 px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{item.product?.name}</p>
                  <p className="text-xs text-gray-400">{formatCurrency(item.price)} por unidade</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Input type="number" min={1} max={item.product?.quantity} value={item.quantity}
                    onChange={e => updateItemQty(item.productId, Number(e.target.value))} className="w-16 text-center" />
                  <span className="text-sm font-semibold text-amber-400 w-20 text-right">{formatCurrency(item.price * item.quantity)}</span>
                  <button type="button" onClick={() => removeItem(item.productId)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="bg-gray-900 border border-amber-500/20 rounded-2xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-8 text-sm text-gray-400">
                <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between gap-8 text-sm text-emerald-400">
                  <span>Desconto</span><span>- {formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between gap-8 pt-1 border-t border-gray-700">
                <span className="text-sm text-gray-400">Total</span>
                <span className="text-3xl font-bold text-amber-400">{formatCurrency(total)}</span>
              </div>
              <p className="text-xs text-gray-500">{items.length} produto(s) • {items.reduce((s, i) => s + i.quantity, 0)} unidades</p>
            </div>
            <Button type="submit" loading={loading} size="lg" className="w-full sm:w-auto">Finalizar Venda</Button>
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
        </div>
      )}
    </form>
  )
}
