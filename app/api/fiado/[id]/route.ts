import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    const body = await request.json()
    const fiado = await prisma.fiado.update({
      where: { id: params.id },
      data: {
        ...body,
        paidAt: body.status === 'COMPLETED' ? new Date() : null,
      },
    })
    return NextResponse.json({ data: fiado })
  } catch (error) {
    console.error('[FIADO PATCH]', error)
    return NextResponse.json({ error: 'Erro ao atualizar fiado' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthUser()
    if (!authUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

    await prisma.fiado.delete({ where: { id: params.id } })
    return NextResponse.json({ message: 'Removido com sucesso' })
  } catch (error) {
    console.error('[FIADO DELETE]', error)
    return NextResponse.json({ error: 'Erro ao remover fiado' }, { status: 500 })
  }
}
