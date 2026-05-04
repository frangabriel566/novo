import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : new Date(new Date().setDate(1))
    const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : new Date()
    to.setUTCHours(23, 59, 59, 999)

    const where = { createdAt: { gte: from, lte: to }, status: 'COMPLETED' as const }

    const [
      salesData,
      topProducts,
      topCustomers,
      paymentMethods,
      expensesData,
      salesByDay,
    ] = await Promise.all([
      prisma.sale.aggregate({ where, _sum: { total: true }, _count: true }),
      prisma.saleItem.groupBy({
        by: ['productId'],
        where: { sale: { ...where } },
        _sum: { quantity: true, price: true },
        _count: true,
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
      prisma.sale.groupBy({
        by: ['customerId'],
        where,
        _sum: { total: true },
        _count: true,
        orderBy: { _sum: { total: 'desc' } },
        take: 5,
      }),
      prisma.sale.groupBy({
        by: ['paymentMethod'],
        where,
        _sum: { total: true },
        _count: true,
      }),
      prisma.expense.aggregate({
        where: { date: { gte: from, lte: to } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.sale.findMany({
        where,
        select: { total: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
    ])

    // Resolve product names for top products
    const productIds = topProducts.map((p) => p.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, category: true },
    })

    const topProductsFormatted = topProducts.map((p) => ({
      ...p,
      product: products.find((pr) => pr.id === p.productId),
      revenue: (p._sum.price ?? 0) * (p._sum.quantity ?? 0),
    }))

    // Resolve customer names for top customers
    const customerIds = topCustomers.map((c) => c.customerId)
    const customers = await prisma.customer.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, name: true, email: true },
    })

    const topCustomersFormatted = topCustomers.map((c) => ({
      ...c,
      customer: customers.find((cu) => cu.id === c.customerId),
    }))

    // Group sales by day
    const salesByDayMap: Record<string, number> = {}
    for (const sale of salesByDay) {
      const key = new Date(sale.createdAt).toISOString().split('T')[0]
      salesByDayMap[key] = (salesByDayMap[key] ?? 0) + sale.total
    }

    const revenue = salesData._sum.total ?? 0
    const totalExpenses = expensesData._sum.amount ?? 0
    const profit = revenue - totalExpenses

    return NextResponse.json({
      data: {
        revenue,
        totalSales: salesData._count,
        totalExpenses,
        profit,
        topProducts: topProductsFormatted,
        topCustomers: topCustomersFormatted,
        paymentMethods,
        salesByDay: Object.entries(salesByDayMap).map(([date, total]) => ({ date, total })),
      },
    })
  } catch (error) {
    console.error('[REPORTS]', error)
    return NextResponse.json({ error: 'Erro ao gerar relatório' }, { status: 500 })
  }
}
