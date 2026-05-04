import Link from 'next/link'
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils'
import { ArrowUpRight } from 'lucide-react'

const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'Dinheiro',
  CREDIT_CARD: 'Cartão Crédito',
  DEBIT_CARD: 'Cartão Débito',
  PIX: 'PIX',
  BANK_TRANSFER: 'Transferência',
  OTHER: 'Outro',
}

interface RecentSalesProps {
  sales: any[]
}

export default function RecentSales({ sales }: RecentSalesProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-white">Vendas Recentes</h3>
          <p className="text-xs text-gray-500 mt-0.5">Últimas transações</p>
        </div>
        <Link
          href="/sales"
          className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors font-medium"
        >
          Ver todas
          <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {sales.length === 0 ? (
        <p className="text-center text-gray-500 text-sm py-8">Nenhuma venda registrada</p>
      ) : (
        <div className="space-y-2">
          {sales.map((sale) => {
            const initials = sale.customer.name
              .split(' ')
              .slice(0, 2)
              .map((n: string) => n[0])
              .join('')
              .toUpperCase()

            const itemSummary = sale.items.length > 0
              ? sale.items.slice(0, 2).map((i: any) => i.product?.name ?? 'Produto').join(', ') +
                (sale.items.length > 2 ? ` +${sale.items.length - 2}` : '')
              : PAYMENT_LABELS[sale.paymentMethod] ?? 'Venda'

            return (
              <div
                key={sale.id}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800/50 transition-colors"
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-xs shrink-0">
                  {initials}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate leading-tight">
                    {sale.customer.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate leading-tight mt-0.5">
                    {itemSummary} · {formatDate(sale.createdAt)}
                  </p>
                </div>

                {/* Valor + status */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-sm font-bold text-white">
                    {formatCurrency(sale.total)}
                  </span>
                  <span className={`inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${getStatusColor(sale.status)}`}>
                    {getStatusLabel(sale.status)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
