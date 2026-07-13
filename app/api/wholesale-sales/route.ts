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
    const from = searchParams.get('from') || ''
    const to = searchParams.get('to') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (search) where.OR = [
      { customer: { name: { contains: search, mode: 'insensitive' } } },
      { notes: { contains: search, mode: 'insensitive' } },
    ]
    if (from || to) {
      const createdAt: Record<string, Date> = {}
      if (from) createdAt.gte = new Date(`${from}T00:00:00`)
      if (to) createdAt.lte = new Date(`${to}T23:59:59.999`)
      where.createdAt = createdAt
    }

    const [sales, total] = await Promise.all([
      prisma.wholesaleSale.findMany({
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
      prisma.wholesaleSale.count({ where }),
    ])

    return NextResponse.json({ data: sales, total, page, pageSize })
  } catch (error) {
    console.error('[WHOLESALE SALES GET]', error)
    return NextResponse.json({ error: 'Erro ao buscar vendas de atacado' }, { status: 500 })
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

    // Validate every submitted price against the wholesale product's real price in the DB.
    // Without this, a tampered request could sell at any price the client chooses to send.
    const products = await prisma.wholesaleProduct.findMany({ where: { id: { in: items.map(i => i.productId) } } })
    const productById = new Map(products.map(p => [p.id, p]))
    for (const item of items) {
      const product = productById.get(item.productId)
      if (!product) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
      if (Math.abs(item.price - product.price) > 0.001) {
        return NextResponse.json({ error: `Preço inválido para ${product.name}. Atualize a página e tente novamente.` }, { status: 400 })
      }
    }

    // Merge duplicate productIds so a repeated item in the cart can't bypass the stock check below.
    const mergedItems = Object.values(
      items.reduce((acc, item) => {
        if (acc[item.productId]) acc[item.productId].quantity += item.quantity
        else acc[item.productId] = { ...item }
        return acc
      }, {} as Record<string, typeof items[number]>)
    )

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    if (discount > subtotal) {
      return NextResponse.json({ error: 'Desconto não pode ser maior que o subtotal da venda' }, { status: 400 })
    }
    const total = Math.max(0, subtotal - discount)
    const saleId = crypto.randomUUID()

    try {
      await prisma.$transaction(async (tx) => {
        for (const item of mergedItems) {
          // Atomic conditional decrement: only succeeds if enough stock remains at write time,
          // preventing overselling when two sales for the same product happen concurrently.
          const result = await tx.wholesaleProduct.updateMany({
            where: { id: item.productId, quantity: { gte: item.quantity } },
            data: { quantity: { decrement: item.quantity } },
          })
          if (result.count === 0) {
            const product = await tx.wholesaleProduct.findUnique({ where: { id: item.productId } })
            if (!product) throw new Error('Produto não encontrado')
            throw new Error(`Estoque insuficiente para ${product.name}. Disponível: ${product.quantity}`)
          }
        }

        await tx.wholesaleSale.create({
          data: {
            id: saleId,
            total, discount, status, notes, paymentMethod, customerId,
            userId: authUser.userId,
            items: { create: items.map(i => ({ wholesaleProductId: i.productId, quantity: i.quantity, price: i.price })) },
          },
        })
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar venda'
      const errStatus = message.startsWith('Estoque insuficiente') || message === 'Produto não encontrado' ? 400 : 500
      return NextResponse.json({ error: message }, { status: errStatus })
    }

    const sale = await prisma.wholesaleSale.findUnique({
      where: { id: saleId },
      include: {
        customer: true,
        user: { select: { id: true, name: true, email: true } },
        items: { include: { product: true } },
      },
    })

    return NextResponse.json({ data: sale }, { status: 201 })
  } catch (error) {
    console.error('[WHOLESALE SALES POST]', error)
    return NextResponse.json({ error: 'Erro ao criar venda' }, { status: 500 })
  }
}
