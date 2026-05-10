import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from') ? new Date(searchParams.get('from')!) : (() => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d })()
    const to = searchParams.get('to') ? new Date(searchParams.get('to')!) : (() => { const d = new Date(); d.setHours(23,59,59,999); return d })()

    const saleWhere = { createdAt: { gte: from, lte: to }, status: 'COMPLETED' as const }
    const expenseWhere = { date: { gte: from, lte: to } }

    const [
      salesData,
      topProducts,
      topCustomers,
      paymentMethods,
      expensesData,
      salesByDay,
      expensesList,
      salesList,
    ] = await Promise.all([
      prisma.sale.aggregate({ where: saleWhere, _sum: { total: true }, _count: true }),
      prisma.$queryRaw<{ productId: string; totalQuantity: number; totalRevenue: number }[]>`
        SELECT si."productId",
               SUM(si.quantity)::int AS "totalQuantity",
               SUM(si.price * si.quantity) AS "totalRevenue"
        FROM sale_items si
        INNER JOIN sales s ON si."saleId" = s.id
        WHERE s."createdAt" >= ${from} AND s."createdAt" <= ${to} AND s.status = 'COMPLETED'
        GROUP BY si."productId"
        ORDER BY SUM(si.quantity) DESC
        LIMIT 5
      `,
      prisma.sale.groupBy({
        by: ['customerId'],
        where: saleWhere,
        _sum: { total: true },
        _count: true,
        orderBy: { _sum: { total: 'desc' } },
        take: 5,
      }),
      prisma.sale.groupBy({
        by: ['paymentMethod'],
        where: saleWhere,
        _sum: { total: true },
        _count: true,
      }),
      prisma.expense.aggregate({ where: expenseWhere, _sum: { amount: true }, _count: true }),
      prisma.sale.findMany({
        where: saleWhere,
        select: { total: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.expense.findMany({
        where: expenseWhere,
        orderBy: { date: 'desc' },
        select: { id: true, description: true, amount: true, category: true, date: true },
      }),
      prisma.sale.findMany({
        where: saleWhere,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, total: true, paymentMethod: true, createdAt: true,
          customer: { select: { name: true } },
          items: { select: { quantity: true, price: true, product: { select: { name: true } } } },
        },
      }),
    ])

    const [products, customers] = await Promise.all([
      prisma.product.findMany({
        where: { id: { in: topProducts.map((p) => p.productId) } },
        select: { id: true, name: true, category: true, price: true, quantity: true },
      }),
      prisma.customer.findMany({
        where: { id: { in: topCustomers.map((c) => c.customerId) } },
        select: { id: true, name: true, email: true },
      }),
    ])

    const topProductsFormatted = topProducts.map((p) => ({
      productId: p.productId,
      product: products.find((pr) => pr.id === p.productId),
      _sum: { quantity: Number(p.totalQuantity) },
      revenue: Number(p.totalRevenue),
    }))

    const topCustomersFormatted = topCustomers.map((c) => ({
      ...c,
      customer: customers.find((cu) => cu.id === c.customerId),
    }))

    const salesByDayMap: Record<string, number> = {}
    for (const sale of salesByDay) {
      const key = new Date(sale.createdAt).toISOString().split('T')[0]
      salesByDayMap[key] = (salesByDayMap[key] ?? 0) + sale.total
    }

    const revenue = salesData._sum.total ?? 0
    const totalExpenses = expensesData._sum.amount ?? 0

    return NextResponse.json({
      data: {
        revenue,
        totalSales: salesData._count,
        totalExpenses,
        profit: revenue - totalExpenses,
        topProducts: topProductsFormatted,
        topCustomers: topCustomersFormatted,
        paymentMethods,
        salesByDay: Object.entries(salesByDayMap).map(([date, total]) => ({ date, total })),
        expensesList,
        salesList,
      },
    })
  } catch (error) {
    console.error('[REPORTS]', error)
    return NextResponse.json({ error: 'Erro ao gerar relatório' }, { status: 500 })
  }
}
