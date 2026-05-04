import { Metadata } from 'next'
import { DollarSign, ShoppingCart, Package, Users, AlertTriangle } from 'lucide-react'
import Header from '@/components/layout/Header'
import StatsCard from '@/components/dashboard/StatsCard'
import SalesChart from '@/components/dashboard/SalesChart'
import RecentSales from '@/components/dashboard/RecentSales'
import { formatCurrency } from '@/lib/utils'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = { title: 'Dashboard' }
export const dynamic = 'force-dynamic'

async function getDashboardStats() {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [
      totalRevenueResult,
      totalSales,
      totalProducts,
      totalCustomers,
      lowStockProducts,
      recentSales,
      salesLast30Days,
      totalExpensesResult,
      totalFiadoPaidResult,
    ] = await Promise.all([
      prisma.sale.aggregate({ where: { status: 'COMPLETED' }, _sum: { total: true } }),
      prisma.sale.count(),
      prisma.product.count(),
      prisma.customer.count(),
      prisma.product.count({ where: { quantity: { lt: 10 } } }),
      prisma.sale.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          customer: true,
          user: { select: { id: true, name: true } },
          items: { include: { product: true } },
        },
      }),
      prisma.sale.findMany({
        where: { status: 'COMPLETED', createdAt: { gte: thirtyDaysAgo } },
        select: { total: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.expense.aggregate({ _sum: { amount: true } }),
      prisma.fiado.aggregate({ where: { status: 'COMPLETED' }, _sum: { amount: true } }),
    ])

    const salesByDate: Record<string, { total: number; count: number }> = {}
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const key = date.toISOString().split('T')[0]
      salesByDate[key] = { total: 0, count: 0 }
    }
    for (const sale of salesLast30Days) {
      const key = new Date(sale.createdAt).toISOString().split('T')[0]
      if (salesByDate[key]) {
        salesByDate[key].total += sale.total
        salesByDate[key].count += 1
      }
    }

    const totalRevenue = totalRevenueResult._sum.total ?? 0
    const totalExpenses = totalExpensesResult._sum.amount ?? 0
    const totalFiadoPaid = totalFiadoPaidResult._sum.amount ?? 0
    const saldo = totalRevenue + totalFiadoPaid - totalExpenses

    return {
      totalRevenue,
      totalExpenses,
      totalFiadoPaid,
      saldo,
      totalSales,
      totalProducts,
      totalCustomers,
      lowStockProducts,
      recentSales: JSON.parse(JSON.stringify(recentSales)) as any,
      salesChartData: Object.entries(salesByDate).map(([date, data]) => ({
        date,
        total: Math.round(data.total * 100) / 100,
        count: data.count,
      })),
    }
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

      <div className="px-4 lg:px-8 py-6 space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatsCard title="Saldo da Conta" value={formatCurrency(stats?.saldo ?? 0)} subtitle={`Vendas − Despesas + Fiados pagos`} icon={DollarSign} color="amber" />
          <StatsCard title="Total de Vendas" value={stats?.totalSales ?? 0} subtitle="Todas as vendas" icon={ShoppingCart} color="blue" />
          <StatsCard title="Produtos" value={stats?.totalProducts ?? 0} subtitle={`${stats?.lowStockProducts ?? 0} com estoque baixo`} icon={Package} color="emerald" />
          <StatsCard title="Clientes" value={stats?.totalCustomers ?? 0} subtitle="Clientes cadastrados" icon={Users} color="rose" />
        </div>

        {(stats?.lowStockProducts ?? 0) > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="text-sm text-amber-300">
              <span className="font-semibold">{stats?.lowStockProducts} produto(s)</span> com estoque baixo (menos de 10 unidades).{' '}
              <a href="/products" className="underline hover:no-underline">Ver produtos</a>
            </p>
          </div>
        )}

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
