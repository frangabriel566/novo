import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { z } from 'zod'

const updateSchema = z.object({
  description: z.string().min(2).optional(),
  amount: z.number().positive().optional(),
  category: z.string().min(1).optional(),
  date: z.string().optional(),
})

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

    const data: Record<string, unknown> = { ...parsed.data }
    if (parsed.data.amount) data.amount = Number(parsed.data.amount)
    if (parsed.data.date) data.date = new Date(parsed.data.date)

    const expense = await prisma.expense.update({ where: { id: params.id }, data })
    return NextResponse.json({ data: expense })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar despesa' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    await prisma.expense.delete({ where: { id: params.id } })
    return NextResponse.json({ message: 'Despesa removida' })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao remover despesa' }, { status: 500 })
  }
}
