import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { z } from 'zod'

const expenseSchema = z.object({
  description: z.string().min(2, 'Descrição obrigatória'),
  amount: z.number().positive('Valor deve ser positivo'),
  category: z.string().min(1, 'Categoria obrigatória'),
  date: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')

    const where: Record<string, unknown> = {}
    if (search) where.OR = [
      { description: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
    ]
    if (category) where.category = { equals: category, mode: 'insensitive' }

    const [expenses, total, totalAmount] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy: { date: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { user: { select: { name: true } } },
      }),
      prisma.expense.count({ where }),
      prisma.expense.aggregate({ where, _sum: { amount: true } }),
    ])

    return NextResponse.json({ data: expenses, total, page, pageSize, totalAmount: totalAmount._sum.amount ?? 0 })
  } catch (error) {
    console.error('[EXPENSES GET]', error)
    return NextResponse.json({ error: 'Erro ao buscar despesas' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await request.json()
    const parsed = expenseSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

    const expense = await prisma.expense.create({
      data: {
        ...parsed.data,
        amount: Number(parsed.data.amount),
        date: parsed.data.date ? new Date(parsed.data.date) : new Date(),
        userId: authUser.userId,
      },
      include: { user: { select: { name: true } } },
    })

    return NextResponse.json({ data: expense }, { status: 201 })
  } catch (error) {
    console.error('[EXPENSES POST]', error)
    return NextResponse.json({ error: 'Erro ao criar despesa' }, { status: 500 })
  }
}
