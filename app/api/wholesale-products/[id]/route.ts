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
})

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.wholesaleProduct.findUnique({ where: { id: params.id } })
    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }
    return NextResponse.json({ data: product })
  } catch (error) {
    console.error('[WHOLESALE PRODUCT GET]', error)
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

    const product = await prisma.wholesaleProduct.update({
      where: { id: params.id },
      data: parsed.data,
    })

    return NextResponse.json({ data: product })
  } catch (error) {
    console.error('[WHOLESALE PRODUCT PUT]', error)
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
      prisma.wholesaleSaleItem.deleteMany({ where: { wholesaleProductId: params.id } }),
      prisma.wholesaleProduct.delete({ where: { id: params.id } }),
    ])

    return NextResponse.json({ message: 'Produto removido com sucesso' })
  } catch (error) {
    console.error('[WHOLESALE PRODUCT DELETE]', error)
    return NextResponse.json({ error: 'Erro ao remover produto' }, { status: 500 })
  }
}
