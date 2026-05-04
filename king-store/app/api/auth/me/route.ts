import { NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const authUser = await getAuthUser()
    if (!authUser) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ data: user })
  } catch (error) {
    console.error('[ME]', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
