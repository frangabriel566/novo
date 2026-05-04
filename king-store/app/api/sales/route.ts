import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { z } from 'zod'

const saleItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
})

const saleSchema = z.object({
  customerId: z.string().min(1, 'Cliente é obrigatório'),
  items: z.array(saleItemSchema).min(1, 'Adicione pelo menos um produto'),
  notes: z.string().optional(),
  status: z.enum(['PENDING', 'COMPLETED']).default('COMPLETED'),
  paymentMethod: z.enum(['CASH','CREDIT_CARD','DEBIT_CARD','PIX','BANK_TRANSFER','OTHER']).default('CASH'),
  discount: z.number().min(0).default(0),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (search) where.OR = [
      { customer: { name: { contains: search, mode: 'insensitive' } } },
      { notes: { contains: search, mode: 'insensitive' } },
    ]

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          customer: true,
          user: { select: { id: true, name: true, email: true } },
          items: { include: { product: true } },
        },
      }),
      prisma.sale.count({ where }),
    ])

    return NextResponse.json({ data: sales, total, page, pageSize })
  } catch (error) {
    console.error('[SALES GET]', error)
    return NextResponse.json({ error: 'Erro ao buscar vendas' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await request.json()
    const parsed = saleSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

    const { customerId, items, notes, status, paymentMethod, discount } = parsed.data

    const customer = await prisma.customer.findUnique({ where: { id: customerId } })
    if (!customer) return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } })
      if (!product) return NextResponse.json({ error: `Produto não encontrado` }, { status: 404 })
      if (product.quantity < item.quantity) {
        return NextResponse.json({ error: `Estoque insuficiente para ${product.name}. Disponível: ${product.quantity}` }, { status: 400 })
      }
    }

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const total = Math.max(0, subtotal - discount)

    const sale = await prisma.$transaction(async (tx) => {
      const newSale = await tx.sale.create({
        data: {
          total, discount, status, notes, paymentMethod, customerId,
          userId: authUser.userId,
          items: { create: items.map(i => ({ productId: i.productId, quantity: i.quantity, price: i.price })) },
        },
        include: {
          customer: true,
          user: { select: { id: true, name: true, email: true } },
          items: { include: { product: true } },
        },
      })

      for (const item of items) {
        await tx.product.update({ where: { id: item.productId }, data: { quantity: { decrement: item.quantity } } })
        await tx.stockMovement.create({
          data: { productId: item.productId, type: 'OUT', quantity: item.quantity, reason: `Venda #${newSale.id.slice(-6)}`, userId: authUser.userId },
        })
      }

      return newSale
    })

    return NextResponse.json({ data: sale }, { status: 201 })
  } catch (error) {
    console.error('[SALES POST]', error)
    return NextResponse.json({ error: 'Erro ao criar venda' }, { status: 500 })
  }
}
