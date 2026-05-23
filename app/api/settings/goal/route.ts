import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

const GOAL_KEYS = ['goal_enabled', 'goal_amount', 'goal_months', 'goal_prize', 'goal_discount'] as const

export async function GET() {
  try {
    const settings = await prisma.setting.findMany({
      where: { key: { in: [...GOAL_KEYS] } },
    })

    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]))

    return NextResponse.json({
      enabled: map.goal_enabled === 'true',
      amount: parseFloat(map.goal_amount ?? '1500'),
      months: parseInt(map.goal_months ?? '2'),
      prize: map.goal_prize ?? 'Peruana',
      discount: parseFloat(map.goal_discount ?? '10'),
    })
  } catch (error) {
    console.error('[GOAL GET]', error)
    return NextResponse.json({ error: 'Erro ao buscar configuração de meta' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await request.json()
    const { enabled, amount, months, prize, discount } = body

    const upserts = [
      { key: 'goal_enabled', value: String(!!enabled) },
      { key: 'goal_amount', value: String(parseFloat(amount) || 1500) },
      { key: 'goal_months', value: String(parseInt(months) || 2) },
      { key: 'goal_prize', value: String(prize || 'Peruana') },
      { key: 'goal_discount', value: String(parseFloat(discount) || 10) },
    ]

    await Promise.all(
      upserts.map((u) =>
        prisma.setting.upsert({
          where: { key: u.key },
          update: { value: u.value },
          create: { key: u.key, value: u.value },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[GOAL POST]', error)
    return NextResponse.json({ error: 'Erro ao salvar meta' }, { status: 500 })
  }
}
