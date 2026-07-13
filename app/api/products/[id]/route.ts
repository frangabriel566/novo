import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  costPrice: z.number().min(0).optional(),
  price: z.number().positive().optional(),
  quantity: z.number().int().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  category: z.string().min(1).optional(),
  wholesalePrice: z.number().positive('Preço de atacado deve ser positivo').optional().nullable(),
  wholesaleMinQty: z.number().int().positive('Quantidade mínima deve ser positiva').optional().nullable(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.product.findUnique({ where: { id: params.id } })
    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }
    return NextResponse.json({ data: product })
  } catch (error) {
    console.error('[PRODUCT GET]', error)
    return NextResponse.json({ error: 'Erro ao buscar produto' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = updateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const existing = await prisma.product.findUnique({ where: { id: params.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    const wholesalePrice = 'wholesalePrice' in parsed.data ? parsed.data.wholesalePrice : existing.wholesalePrice
    const wholesaleMinQty = 'wholesaleMinQty' in parsed.data ? parsed.data.wholesaleMinQty : existing.wholesaleMinQty
    const price = parsed.data.price ?? existing.price

    if ((wholesalePrice == null) !== (wholesaleMinQty == null)) {
      return NextResponse.json({ error: 'Informe preço de atacado e quantidade mínima juntos' }, { status: 400 })
    }
    if (wholesalePrice != null && wholesalePrice >= price) {
      return NextResponse.json({ error: 'Preço de atacado deve ser menor que o preço de venda' }, { status: 400 })
    }

    const product = await prisma.product.update({
      where: { id: params.id },
      data: parsed.data,
    })

    return NextResponse.json({ data: product })
  } catch (error) {
    console.error('[PRODUCT PUT]', error)
    return NextResponse.json({ error: 'Erro ao atualizar produto' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    await prisma.$transaction([
      prisma.saleItem.deleteMany({ where: { productId: params.id } }),
      prisma.stockMovement.deleteMany({ where: { productId: params.id } }),
      prisma.product.delete({ where: { id: params.id } }),
    ])

    return NextResponse.json({ message: 'Produto removido com sucesso' })
  } catch (error) {
    console.error('[PRODUCT DELETE]', error)
    return NextResponse.json({ error: 'Erro ao remover produto' }, { status: 500 })
  }
}
