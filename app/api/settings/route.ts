import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'saldo_ajuste' } })
    return NextResponse.json({ value: setting ? parseFloat(setting.value) : 0 })
  } catch {
    return NextResponse.json({ value: 0 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const { value } = await request.json()
    const amount = parseFloat(value)
    if (isNaN(amount)) return NextResponse.json({ error: 'Valor inválido' }, { status: 400 })

    await prisma.setting.upsert({
      where: { key: 'saldo_ajuste' },
      update: { value: String(amount) },
      create: { key: 'saldo_ajuste', value: String(amount) },
    })

    return NextResponse.json({ value: amount })
  } catch (error) {
    console.error('[SETTINGS POST]', error)
    return NextResponse.json({ error: 'Erro ao salvar configuração' }, { status: 500 })
  }
}
