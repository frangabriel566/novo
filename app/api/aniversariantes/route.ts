import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const today = new Date()
    const todayMonth = today.getMonth() + 1
    const todayDay = today.getDate()

    const [customers, birthdaySettings] = await Promise.all([
      prisma.customer.findMany({
        where: { birthDate: { not: null } },
        select: { id: true, name: true, phone: true, birthDate: true },
        orderBy: { name: 'asc' },
      }),
      prisma.setting.findMany({
        where: { key: { in: ['birthday_message', 'birthday_discount'] } },
      }),
    ])

    const settingMap = Object.fromEntries(birthdaySettings.map((s) => [s.key, s.value]))
    const discount = settingMap.birthday_discount ?? '30'
    const messageTemplate =
      settingMap.birthday_message ??
      'Parabéns {nome}! 🎉🎂 A King Store deseja a você um feliz aniversário! Como presente especial, você tem {desconto}% de desconto em toda a nossa loja hoje. Aproveite e venha nos visitar! 🛍️🎁'

    const parseBD = (d: Date) => new Date(d.toISOString().split('T')[0] + 'T12:00:00')

    const todayBirthdays = customers
      .filter((c) => {
        const bd = parseBD(c.birthDate!)
        return bd.getMonth() + 1 === todayMonth && bd.getDate() === todayDay
      })
      .map((c) => {
        const phone = c.phone ? c.phone.replace(/\D/g, '') : null
        const waPhone = phone && phone.length >= 10 ? `55${phone}` : null
        const message = messageTemplate
          .replace(/\{nome\}/g, c.name)
          .replace(/\{desconto\}/g, discount)
        return {
          id: c.id,
          name: c.name,
          phone: c.phone,
          waLink: waPhone ? `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}` : null,
        }
      })

    // Próximos 7 dias
    const upcoming = customers
      .filter((c) => {
        const bd = parseBD(c.birthDate!)
        const bMonth = bd.getMonth() + 1
        const bDay = bd.getDate()
        for (let i = 1; i <= 7; i++) {
          const d = new Date(today)
          d.setDate(today.getDate() + i)
          if (bMonth === d.getMonth() + 1 && bDay === d.getDate()) return true
        }
        return false
      })
      .map((c) => {
        const bd = parseBD(c.birthDate!)
        const bMonth = bd.getMonth() + 1
        const bDay = bd.getDate()
        let daysUntil = 0
        for (let i = 1; i <= 7; i++) {
          const d = new Date(today)
          d.setDate(today.getDate() + i)
          if (bMonth === d.getMonth() + 1 && bDay === d.getDate()) { daysUntil = i; break }
        }
        const phone = c.phone ? c.phone.replace(/\D/g, '') : null
        const waPhone = phone && phone.length >= 10 ? `55${phone}` : null
        const message = messageTemplate
          .replace(/\{nome\}/g, c.name)
          .replace(/\{desconto\}/g, discount)
        return {
          id: c.id,
          name: c.name,
          phone: c.phone,
          daysUntil,
          birthDay: bDay,
          birthMonth: bMonth,
          waLink: waPhone ? `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}` : null,
        }
      })
      .sort((a, b) => a.daysUntil - b.daysUntil)

    return NextResponse.json({ today: todayBirthdays, upcoming, discount })
  } catch (error) {
    console.error('[ANIVERSARIANTES]', error)
    return NextResponse.json({ error: 'Erro ao buscar aniversariantes' }, { status: 500 })
  }
}
