import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [lowStockProducts, pendingSales, recentSales] = await Promise.all([
      prisma.product.findMany({
        where: { quantity: { lt: 10 } },
        select: { id: true, name: true, quantity: true },
        orderBy: { quantity: 'asc' },
        take: 5,
      }),
      prisma.sale.findMany({
        where: { status: 'PENDING' },
        select: { id: true, total: true, customer: { select: { name: true } }, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
      prisma.sale.findMany({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
        select: { id: true, total: true, customer: { select: { name: true } }, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
    ])

    const notifications = [
      ...lowStockProducts.map((p) => ({
        id: `stock-${p.id}`,
        type: 'low_stock' as const,
        title: 'Estoque baixo',
        message: `${p.name} tem apenas ${p.quantity} unidade(s)`,
        createdAt: new Date().toISOString(),
        read: false,
      })),
      ...pendingSales.map((s) => ({
        id: `pending-${s.id}`,
        type: 'pending_sale' as const,
        title: 'Venda pendente',
        message: `Venda de ${s.customer.name} aguarda confirmação`,
        createdAt: s.createdAt.toISOString(),
        read: false,
      })),
      ...recentSales.map((s) => ({
        id: `sale-${s.id}`,
        type: 'new_sale' as const,
        title: 'Nova venda',
        message: `Venda concluída para ${s.customer.name}`,
        createdAt: s.createdAt.toISOString(),
        read: true,
      })),
    ]

    return NextResponse.json({ data: notifications })
  } catch (error) {
    console.error('[NOTIFICATIONS]', error)
    return NextResponse.json({ error: 'Erro ao buscar notificações' }, { status: 500 })
  }
}
