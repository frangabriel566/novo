import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().min(2).optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
})

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    // Non-admins can only edit themselves
    if (authUser.role !== 'ADMIN' && authUser.userId !== params.id) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

    const data: Record<string, unknown> = { ...parsed.data }
    if (parsed.data.password) {
      data.password = await bcrypt.hash(parsed.data.password, 12)
    }

    // Non-admins cannot change their own role
    if (authUser.role !== 'ADMIN') delete data.role

    const user = await prisma.user.update({
      where: { id: params.id },
      data,
      select: { id: true, name: true, email: true, role: true },
    })

    return NextResponse.json({ data: user })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser()
    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    if (authUser.userId === params.id) {
      return NextResponse.json({ error: 'Você não pode remover sua própria conta' }, { status: 400 })
    }

    await prisma.user.delete({ where: { id: params.id } })
    return NextResponse.json({ message: 'Usuário removido' })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao remover usuário' }, { status: 500 })
  }
}
