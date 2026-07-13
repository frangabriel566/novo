import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { z } from 'zod'

const phoneRegex = /^\(?\d{2}\)?[\s-]?\d{4,5}-?\d{4}$/

const customerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  phone: z.string().min(1, 'Telefone é obrigatório').regex(phoneRegex, 'Telefone inválido. Use o formato (DDD) 99999-9999'),
  address: z.string().optional(),
  birthDate: z.string().min(1, 'Data de nascimento é obrigatória')
    .refine((v) => !isNaN(Date.parse(v)), 'Data de nascimento inválida')
    .refine((v) => new Date(v) <= new Date(), 'Data de nascimento não pode ser no futuro'),
  type: z.enum(['RETAIL', 'WHOLESALE']).default('RETAIL'),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const withPurchases = searchParams.get('withPurchases') === 'true'

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search, mode: 'insensitive' as const } },
            { address: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { _count: { select: { sales: true } } },
      }),
      prisma.customer.count({ where }),
    ])

    // If requested, include total purchases per customer for goal tracking
    if (withPurchases) {
      const goalMonths = await prisma.setting.findUnique({ where: { key: 'goal_months' } })
      const months = goalMonths ? parseInt(goalMonths.value) : 2
      const since = new Date()
      since.setMonth(since.getMonth() - months)

      const purchases = await prisma.sale.groupBy({
        by: ['customerId'],
        where: { status: 'COMPLETED', createdAt: { gte: since } },
        _sum: { total: true },
      })

      const purchaseMap = new Map(purchases.map((p) => [p.customerId, p._sum.total ?? 0]))
      const enriched = customers.map((c) => ({ ...c, totalPurchases: purchaseMap.get(c.id) ?? 0 }))
      return NextResponse.json({ data: enriched, total, page, pageSize })
    }

    return NextResponse.json({ data: customers, total, page, pageSize })
  } catch (error) {
    console.error('[CUSTOMERS GET]', error)
    return NextResponse.json({ error: 'Erro ao buscar clientes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = customerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { birthDate, ...rest } = parsed.data
    const customer = await prisma.customer.create({
      data: {
        ...rest,
        birthDate: birthDate ? new Date(birthDate) : null,
      },
    })
    return NextResponse.json({ data: customer }, { status: 201 })
  } catch (error) {
    console.error('[CUSTOMERS POST]', error)
    return NextResponse.json({ error: 'Erro ao criar cliente' }, { status: 500 })
  }
}
