import { Metadata } from 'next'
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  AlertTriangle,
} from 'lucide-react'
import Header from '@/components/layout/Header'
import StatsCard from '@/components/dashboard/StatsCard'
import SalesChart from '@/components/dashboard/SalesChart'
import RecentSales from '@/components/dashboard/RecentSales'
import { formatCurrency } from '@/lib/utils'
import { DashboardStats } from '@/types'
import { getAuthUser } from '@/lib/auth'

export const metadata: Metadata = { title: 'Dashboard' }
export const dynamic = 'force-dynamic'

async function getDashboardStats(): Promise<DashboardStats | null> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const { cookies } = await import('next/headers')
    const token = cookies().get('token')?.value

    const res = await fetch(`${baseUrl}/api/dashboard`, {
      headers: { Cookie: `token=${token}` },
      cache: 'no-store',
    })

    if (!res.ok) return null
    const data = await res.json()
    return data.data
  } catch {
    return null
  }
}

export default async function DashboardPage() {
  const [user, stats] = await Promise.all([getAuthUser(), getDashboardStats()])

  return (
    <div>
      <Header
        title={`Olá, ${user?.name?.split(' ')[0] ?? 'Usuário'} 👋`}
        subtitle="Aqui está o resumo do seu negócio hoje"
      />

      <div className="px-8 py-6 space-y-6 animate-fade-in">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatsCard
            title="Receita Total"
            value={formatCurrency(stats?.totalRevenue ?? 0)}
            subtitle="Vendas concluídas"
            icon={DollarSign}
            color="amber"
          />
          <StatsCard
            title="Total de Vendas"
            value={stats?.totalSales ?? 0}
            subtitle="Todas as vendas"
            icon={ShoppingCart}
            color="blue"
          />
          <StatsCard
            title="Produtos"
            value={stats?.totalProducts ?? 0}
            subtitle={`${stats?.lowStockProducts ?? 0} com estoque baixo`}
            icon={Package}
            color="emerald"
          />
          <StatsCard
            title="Clientes"
            value={stats?.totalCustomers ?? 0}
            subtitle="Clientes cadastrados"
            icon={Users}
            color="rose"
          />
        </div>

        {/* Low stock alert */}
        {(stats?.lowStockProducts ?? 0) > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="text-sm text-amber-300">
              <span className="font-semibold">{stats?.lowStockProducts} produto(s)</span> com estoque baixo (menos de 10 unidades).{' '}
              <a href="/products" className="underline hover:no-underline">Ver produtos</a>
            </p>
          </div>
        )}

        {/* Chart + Recent Sales */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <SalesChart data={stats?.salesChartData ?? []} />
          </div>
          <div>
            <RecentSales sales={stats?.recentSales ?? []} />
          </div>
        </div>
      </div>
    </div>
  )
}
