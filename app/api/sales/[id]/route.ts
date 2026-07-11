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

    const existing = await prisma.sale.findUnique({
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
            await tx.product.update({
              where: { id: item.productId },
              data: { quantity: { increment: item.quantity } },
            })
          }
          await tx.stockMovement.createMany({
            data: existing.items.map(item => ({
              productId: item.productId, type: 'IN' as const, quantity: item.quantity,
              reason: `Cancelamento venda #${existing.id.slice(-6)}`, userId: authUser.userId,
            })),
          })
        } else if (wasCancelled && !willBeCancelled) {
          // Reactivating a cancelled sale: re-debit stock atomically, failing if unavailable.
          for (const item of existing.items) {
            const result = await tx.product.updateMany({
              where: { id: item.productId, quantity: { gte: item.quantity } },
              data: { quantity: { decrement: item.quantity } },
            })
            if (result.count === 0) {
              const product = await tx.product.findUnique({ where: { id: item.productId } })
              throw new Error(`Estoque insuficiente para ${product?.name ?? 'produto'} para reativar esta venda.`)
            }
          }
          await tx.stockMovement.createMany({
            data: existing.items.map(item => ({
              productId: item.productId, type: 'OUT' as const, quantity: item.quantity,
              reason: `Reativação venda #${existing.id.slice(-6)}`, userId: authUser.userId,
            })),
          })
        }

        await tx.sale.update({ where: { id: params.id }, data: { status: newStatus } })
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar venda'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    const sale = await prisma.sale.findUnique({
      where: { id: params.id },
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
