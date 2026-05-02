import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q') || ''

    if (!q.trim()) return NextResponse.json({ data: { products: [], customers: [], sales: [] } })

    const [products, customers, sales] = await Promise.all([
      prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { category: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, name: true, price: true, category: true },
      }),
      prisma.customer.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, name: true, email: true },
      }),
      prisma.sale.findMany({
        where: { customer: { name: { contains: q, mode: 'insensitive' } } },
        take: 5,
        select: { id: true, total: true, customer: { select: { name: true } } },
      }),
    ])

    return NextResponse.json({
      data: {
        products,
        customers,
        sales: sales.map((s) => ({ id: s.id, total: s.total, customerName: s.customer.name })),
      },
    })
  } catch (error) {
    console.error('[SEARCH]', error)
    return NextResponse.json({ error: 'Erro na busca' }, { status: 500 })
  }
}
