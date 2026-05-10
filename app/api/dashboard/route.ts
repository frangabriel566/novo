import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
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
    ] = await Promise.all([
      prisma.sale.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { total: true },
      }),
      prisma.sale.count(),
      prisma.product.count(),
      prisma.customer.count(),
      prisma.$queryRaw<[{ count: bigint }]>`SELECT COUNT(*) as count FROM products WHERE quantity < "lowStockThreshold"`,
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
        where: {
          status: 'COMPLETED',
          createdAt: { gte: thirtyDaysAgo },
        },
        select: { total: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
    ])

    // Group sales by date for chart
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

    const salesChartData = Object.entries(salesByDate).map(([date, data]) => ({
      date,
      total: Math.round(data.total * 100) / 100,
      count: data.count,
    }))

    return NextResponse.json({
      data: {
        totalRevenue: totalRevenueResult._sum.total ?? 0,
        totalSales,
        totalProducts,
        totalCustomers,
        lowStockProducts: Number(lowStockProducts[0].count),
        recentSales,
        salesChartData,
      },
    })
  } catch (error) {
    console.error('[DASHBOARD]', error)
    return NextResponse.json({ error: 'Erro ao carregar dashboard' }, { status: 500 })
  }
}
