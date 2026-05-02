import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { z } from 'zod'

const movementSchema = z.object({
  productId: z.string().min(1),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
  quantity: z.number().int().positive(),
  reason: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '15')

    const where = productId ? { productId } : {}

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          product: { select: { id: true, name: true, quantity: true } },
          user: { select: { name: true } },
        },
      }),
      prisma.stockMovement.count({ where }),
    ])

    return NextResponse.json({ data: movements, total, page, pageSize })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar movimentações' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await request.json()
    const parsed = movementSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

    const { productId, type, quantity, reason } = parsed.data

    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })

    if (type === 'OUT' && product.quantity < quantity) {
      return NextResponse.json({ error: `Estoque insuficiente. Disponível: ${product.quantity}` }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const movement = await tx.stockMovement.create({
        data: { productId, type, quantity, reason, userId: authUser.userId },
        include: { product: { select: { name: true } }, user: { select: { name: true } } },
      })

      const delta = type === 'IN' ? quantity : type === 'OUT' ? -quantity : quantity - product.quantity
      await tx.product.update({
        where: { id: productId },
        data: { quantity: type === 'ADJUSTMENT' ? quantity : { increment: delta } },
      })

      return movement
    })

    return NextResponse.json({ data: result }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao registrar movimentação' }, { status: 500 })
  }
}
