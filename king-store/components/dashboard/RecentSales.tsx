import Link from 'next/link'
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/utils'
import { Sale } from '@/types'
import { ArrowUpRight } from 'lucide-react'

interface RecentSalesProps {
  sales: Sale[]
}

export default function RecentSales({ sales }: RecentSalesProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-white">Vendas Recentes</h3>
          <p className="text-sm text-gray-400 mt-0.5">Últimas transações realizadas</p>
        </div>
        <Link
          href="/sales"
          className="flex items-center gap-1 text-sm text-amber-400 hover:text-amber-300 transition-colors"
        >
          Ver todas
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>
      {sales.length === 0 ? (
        <p className="text-center text-gray-500 py-8">Nenhuma venda registrada</p>
      ) : (
        <div className="space-y-3">
          {sales.map((sale) => (
            <div
              key={sale.id}
              className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-sm">
                  {sale.customer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{sale.customer.name}</p>
                  <p className="text-xs text-gray-500">
                    {sale.items.length} {sale.items.length === 1 ? 'item' : 'itens'} • {formatDate(sale.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(sale.status)}`}
                >
                  {getStatusLabel(sale.status)}
                </span>
                <span className="text-sm font-semibold text-white">
                  {formatCurrency(sale.total)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
