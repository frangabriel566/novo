'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface ChartData {
  date: string
  total: number
  count: number
}

interface SalesChartProps {
  data: ChartData[]
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null

  const date = new Date(label + 'T12:00:00')
  const formatted = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  })

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-3 shadow-xl">
      <p className="text-sm font-medium text-gray-300 mb-2">{formatted}</p>
      <p className="text-sm text-amber-400 font-semibold">
        {formatCurrency(payload[0]?.value ?? 0)}
      </p>
      <p className="text-xs text-gray-500 mt-1">
        {payload[1]?.value ?? 0} {payload[1]?.value === 1 ? 'venda' : 'vendas'}
      </p>
    </div>
  )
}

export default function SalesChart({ data }: SalesChartProps) {
  const formattedData = data.map((d) => ({
    ...d,
    label: new Date(d.date + 'T12:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    }),
  }))

  // Show only every 5th label to avoid crowding
  const tickFormatter = (_: string, index: number) =>
    index % 5 === 0 ? formattedData[index]?.label ?? '' : ''

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-white">Vendas - Últimos 30 dias</h3>
          <p className="text-sm text-gray-400 mt-0.5">Receita diária de vendas concluídas</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={formattedData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={tickFormatter}
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) =>
              v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`
            }
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={55}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#f59e0b"
            strokeWidth={2}
            fill="url(#colorTotal)"
            dot={false}
            activeDot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
