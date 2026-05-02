import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { z } from 'zod'

const fiadoSchema = z.object({
  customerName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  amount: z.number().positive('Valor deve ser positivo'),
  description: z.string().optional(),
})

export async function GET() {
  try {
    const fiados = await prisma.fiado.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } } },
    })
    return NextResponse.json({ data: fiados })
  } catch (error) {
    console.error('[FIADO GET]', error)
    return NextResponse.json({ error: 'Erro ao buscar fiados' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await request.json()
    const parsed = fiadoSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

    const fiado = await prisma.fiado.create({
      data: { ...parsed.data, userId: authUser.userId },
    })
    return NextResponse.json({ data: fiado }, { status: 201 })
  } catch (error) {
    console.error('[FIADO POST]', error)
    return NextResponse.json({ error: 'Erro ao criar fiado' }, { status: 500 })
  }
}
