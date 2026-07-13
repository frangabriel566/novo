import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { z } from 'zod'

const phoneRegex = /^\(?\d{2}\)?[\s-]?\d{4,5}-?\d{4}$/

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(1, 'Telefone é obrigatório').regex(phoneRegex, 'Telefone inválido. Use o formato (DDD) 99999-9999'),
  address: z.string().optional().nullable(),
  birthDate: z.string().min(1, 'Data de nascimento é obrigatória')
    .refine((v) => !isNaN(Date.parse(v)), 'Data de nascimento inválida')
    .refine((v) => new Date(v) <= new Date(), 'Data de nascimento não pode ser no futuro'),
  type: z.enum(['RETAIL', 'WHOLESALE']).optional(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        sales: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { items: { include: { product: true } } },
        },
        _count: { select: { sales: true } },
      },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }
    return NextResponse.json({ data: customer })
  } catch (error) {
    console.error('[CUSTOMER GET]', error)
    return NextResponse.json({ error: 'Erro ao buscar cliente' }, { status: 500 })
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

    const { birthDate, ...rest } = parsed.data
    const customer = await prisma.customer.update({
      where: { id: params.id },
      data: {
        ...rest,
        birthDate: birthDate === null ? null : birthDate ? new Date(birthDate) : undefined,
      },
    })

    return NextResponse.json({ data: customer })
  } catch (error) {
    console.error('[CUSTOMER PUT]', error)
    return NextResponse.json({ error: 'Erro ao atualizar cliente' }, { status: 500 })
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

    await prisma.customer.delete({ where: { id: params.id } })
    return NextResponse.json({ message: 'Cliente removido com sucesso' })
  } catch (error) {
    console.error('[CUSTOMER DELETE]', error)
    return NextResponse.json({ error: 'Erro ao remover cliente' }, { status: 500 })
  }
}
