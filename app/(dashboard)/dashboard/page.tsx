import { Metadata } from 'next'
import { DollarSign, ShoppingCart, Package, Users, AlertTriangle, TrendingUp, TrendingDown, Wallet } from 'lucide-react'
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
        select: {
          id: true,
          total: true,
          status: true,
          paymentMethod: true,
          createdAt: true,
          customer: { select: { name: true } },
          items: { select: { quantity: true, price: true, product: { select: { name: true } } } },
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

        {/* Saldo principal + detalhamento */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Card saldo grande */}
          <div className="lg:col-span-1 bg-gray-900 border border-amber-500/30 rounded-2xl p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-400">Saldo da Conta</p>
              <div className="p-2 rounded-xl bg-amber-500/10">
                <Wallet className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <p className={`text-3xl font-bold ${(stats?.saldo ?? 0) >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
              {formatCurrency(stats?.saldo ?? 0)}
            </p>
            <div className="mt-4 space-y-1.5 border-t border-gray-800 pt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-400" /> Receita vendas</span>
                <span className="text-emerald-400 font-medium">+{formatCurrency(stats?.totalRevenue ?? 0)}</span>
              </div>
              {(stats?.totalFiadoPaid ?? 0) > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 flex items-center gap-1"><TrendingUp className="w-3 h-3 text-blue-400" /> Fiados recebidos</span>
                  <span className="text-blue-400 font-medium">+{formatCurrency(stats?.totalFiadoPaid ?? 0)}</span>
                </div>
              )}
              {(stats?.totalExpenses ?? 0) > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 flex items-center gap-1"><TrendingDown className="w-3 h-3 text-rose-400" /> Despesas</span>
                  <span className="text-rose-400 font-medium">−{formatCurrency(stats?.totalExpenses ?? 0)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Cards secundários */}
          <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatsCard title="Total de Vendas" value={stats?.totalSales ?? 0} subtitle="Todas as vendas" icon={ShoppingCart} color="blue" />
            <StatsCard title="Produtos" value={stats?.totalProducts ?? 0} subtitle={`${stats?.lowStockProducts ?? 0} com estoque baixo`} icon={Package} color="emerald" />
            <StatsCard title="Clientes" value={stats?.totalCustomers ?? 0} subtitle="Clientes cadastrados" icon={Users} color="rose" />
          </div>
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
