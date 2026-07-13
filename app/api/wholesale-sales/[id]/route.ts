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
    const sale = await prisma.wholesaleSale.findUnique({
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
    console.error('[WHOLESALE SALE GET]', error)
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

    const existing = await prisma.wholesaleSale.findUnique({
      where: { id: params.id },
      include: { items: true },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Venda não encontrada' }, { status: 404 })
    }

    const newStatus = parsed.data.status
    const wasCancelled = existing.status === 'CANCELLED'
    const willBeCancelled = newStatus === 'CANCELLED'

    try {
      await prisma.$transaction(async (tx) => {
        if (!wasCancelled && willBeCancelled) {
          // Cancelling: restore stock reserved/consumed by this sale.
          for (const item of existing.items) {
            await tx.wholesaleProduct.update({
              where: { id: item.wholesaleProductId },
              data: { quantity: { increment: item.quantity } },
            })
          }
        } else if (wasCancelled && !willBeCancelled) {
          // Reactivating a cancelled sale: re-debit stock atomically, failing if unavailable.
          for (const item of existing.items) {
            const result = await tx.wholesaleProduct.updateMany({
              where: { id: item.wholesaleProductId, quantity: { gte: item.quantity } },
              data: { quantity: { decrement: item.quantity } },
            })
            if (result.count === 0) {
              const product = await tx.wholesaleProduct.findUnique({ where: { id: item.wholesaleProductId } })
              throw new Error(`Estoque insuficiente para ${product?.name ?? 'produto'} para reativar esta venda.`)
            }
          }
        }

        await tx.wholesaleSale.update({ where: { id: params.id }, data: { status: newStatus } })
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar venda'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const sale = await prisma.wholesaleSale.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        items: { include: { product: true } },
      },
    })

    return NextResponse.json({ data: sale })
  } catch (error) {
    console.error('[WHOLESALE SALE PATCH]', error)
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
    const sale = await prisma.wholesaleSale.findUnique({
      where: { id: params.id },
      include: { items: true },
    })

    if (!sale) {
      return NextResponse.json({ error: 'Venda não encontrada' }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.wholesaleSaleItem.deleteMany({ where: { wholesaleSaleId: params.id } })
      await tx.wholesaleSale.delete({ where: { id: params.id } })

      // Restore stock — skip if the sale was already cancelled, since its stock
      // was already returned when it was cancelled (avoids double-crediting stock).
      if (sale.status !== 'CANCELLED') {
        for (const item of sale.items) {
          await tx.wholesaleProduct.update({
            where: { id: item.wholesaleProductId },
            data: { quantity: { increment: item.quantity } },
          })
        }
      }
    })

    return NextResponse.json({ message: 'Venda removida com sucesso' })
  } catch (error) {
    console.error('[WHOLESALE SALE DELETE]', error)
    return NextResponse.json({ error: 'Erro ao remover venda' }, { status: 500 })
  }
}
