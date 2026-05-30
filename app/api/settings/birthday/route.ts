import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

const DEFAULT_MESSAGE =
  'Parabéns {nome}! 🎉🎂 Você recebe {desconto}% de desconto hoje por ser seu aniversário na King Store. Venha nos visitar! 🛍️'

export async function GET() {
  try {
    const settings = await prisma.setting.findMany({
      where: { key: { in: ['birthday_message', 'birthday_discount'] } },
    })
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]))
    return NextResponse.json({
      message: map.birthday_message ?? DEFAULT_MESSAGE,
      discount: parseFloat(map.birthday_discount ?? '30'),
    })
  } catch (error) {
    console.error('[BIRTHDAY GET]', error)
    return NextResponse.json({ error: 'Erro ao buscar configuração' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await request.json()
    const { message, discount } = body

    await Promise.all([
      prisma.setting.upsert({
        where: { key: 'birthday_message' },
        update: { value: String(message ?? DEFAULT_MESSAGE) },
        create: { key: 'birthday_message', value: String(message ?? DEFAULT_MESSAGE) },
      }),
      prisma.setting.upsert({
        where: { key: 'birthday_discount' },
        update: { value: String(parseFloat(discount) || 30) },
        create: { key: 'birthday_discount', value: String(parseFloat(discount) || 30) },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[BIRTHDAY POST]', error)
    return NextResponse.json({ error: 'Erro ao salvar configuração' }, { status: 500 })
  }
}
