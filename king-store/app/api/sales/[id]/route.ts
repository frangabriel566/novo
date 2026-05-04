import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { z } from 'zod'

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        user: { select: { id: true, name: true, email: true } },
        items: { include: { product: true } },
      },
    })

    if (!sale) {
      return NextResponse.json({ error: 'Venda não encontrada' }, { status: 404 })
    }
    return NextResponse.json({ data: sale })
  } catch (error) {
    console.error('[SALE GET]', error)
    return NextResponse.json({ error: 'Erro ao buscar venda' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = updateStatusSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const sale = await prisma.sale.update({
      where: { id: params.id },
      data: { status: parsed.data.status },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    })

    return NextResponse.json({ data: sale })
  } catch (error) {
    console.error('[SALE PATCH]', error)
    return NextResponse.json({ error: 'Erro ao atualizar venda' }, { status: 500 })
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

    // Restore stock when deleting a sale
    const sale = await prisma.sale.findUnique({
      where: { id: params.id },
      include: { items: true },
    })

    if (!sale) {
      return NextResponse.json({ error: 'Venda não encontrada' }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.saleItem.deleteMany({ where: { saleId: params.id } })
      await tx.sale.delete({ where: { id: params.id } })

      // Restore stock
      for (const item of sale.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: { increment: item.quantity } },
        })
      }
    })

    return NextResponse.json({ message: 'Venda removida com sucesso' })
  } catch (error) {
    console.error('[SALE DELETE]', error)
    return NextResponse.json({ error: 'Erro ao remover venda' }, { status: 500 })
  }
}
