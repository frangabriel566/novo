import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const today = new Date()
    const todayMonth = today.getMonth() + 1
    const todayDay = today.getDate()

    const [lowStockProducts, pendingSales, recentSales, birthdayCustomers, goalSettings, birthdaySettings] =
      await Promise.all([
        prisma.$queryRaw<{ id: string; name: string; quantity: number }[]>`
          SELECT id, name, quantity FROM products WHERE quantity < "lowStockThreshold" ORDER BY quantity ASC LIMIT 5
        `,
        prisma.sale.findMany({
          where: { status: 'PENDING' },
          select: { id: true, total: true, customer: { select: { name: true } }, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 3,
        }),
        prisma.sale.findMany({
          where: {
            status: 'COMPLETED',
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
          select: { id: true, total: true, customer: { select: { name: true } }, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 3,
        }),
        prisma.customer.findMany({
          where: { birthDate: { not: null } },
          select: { id: true, name: true, phone: true, birthDate: true },
        }),
        prisma.setting.findMany({
          where: { key: { in: ['goal_enabled', 'goal_amount', 'goal_months', 'goal_prize', 'goal_discount'] } },
        }),
        prisma.setting.findMany({
          where: { key: { in: ['birthday_message', 'birthday_discount'] } },
        }),
      ])

    // --- Birthday settings ---
    const birthdayMap = Object.fromEntries(birthdaySettings.map((s) => [s.key, s.value]))
    const birthdayDiscount = birthdayMap.birthday_discount ?? '30'
    const birthdayMessageTemplate =
      birthdayMap.birthday_message ??
      'Parabéns {nome}! 🎉🎂 A King Store deseja a você um feliz aniversário! Como presente especial, você tem {desconto}% de desconto em toda a nossa loja hoje. Aproveite e venha nos visitar! 🛍️🎁'

    // --- Birthday notifications (only today) ---
    const birthdayNotifications = birthdayCustomers
      .filter((c) => {
        if (!c.birthDate) return false
        const bd = new Date(c.birthDate)
        return bd.getMonth() + 1 === todayMonth && bd.getDate() === todayDay
      })
      .map((c) => {
        const phone = c.phone ? c.phone.replace(/\D/g, '') : null
        const waPhone = phone && phone.length >= 10 ? `55${phone}` : null
        const waMessage = birthdayMessageTemplate
          .replace(/\{nome\}/g, c.name)
          .replace(/\{desconto\}/g, birthdayDiscount)
        return {
          id: `birthday-${c.id}`,
          type: 'birthday' as const,
          title: '🎂 Aniversário hoje!',
          message: `${c.name} faz aniversário hoje`,
          customerId: c.id,
          customerName: c.name,
          waLink: waPhone
            ? `https://wa.me/${waPhone}?text=${encodeURIComponent(waMessage)}`
            : null,
          createdAt: new Date().toISOString(),
          read: false,
        }
      })

    // --- Goal notifications ---
    const goalMap = Object.fromEntries(goalSettings.map((s) => [s.key, s.value]))
    const goalEnabled = goalMap.goal_enabled === 'true'
    const goalAmount = parseFloat(goalMap.goal_amount ?? '1500')
    const goalMonths = parseInt(goalMap.goal_months ?? '2')
    const goalPrize = goalMap.goal_prize ?? 'Peruana'

    const goalNotifications: {
      id: string
      type: 'goal_reached'
      title: string
      message: string
      customerId: string
      customerName: string
      waLink: string | null
      createdAt: string
      read: boolean
    }[] = []

    if (goalEnabled) {
      const since = new Date()
      since.setMonth(since.getMonth() - goalMonths)

      const purchases = await prisma.sale.groupBy({
        by: ['customerId'],
        where: { status: 'COMPLETED', createdAt: { gte: since } },
        _sum: { total: true },
      })

      const achieved = purchases.filter((p) => (p._sum.total ?? 0) >= goalAmount)

      if (achieved.length > 0) {
        const customerIds = achieved.map((p) => p.customerId)
        const achievedCustomers = await prisma.customer.findMany({
          where: { id: { in: customerIds } },
          select: { id: true, name: true, phone: true },
        })

        const purchaseByCustomer = new Map(achieved.map((p) => [p.customerId, p._sum.total ?? 0]))
        achievedCustomers.forEach((c) => {
          const total = purchaseByCustomer.get(c.id) ?? 0
          const phone = c.phone ? c.phone.replace(/\D/g, '') : null
          const waPhone = phone && phone.length >= 10 ? `55${phone}` : null
          goalNotifications.push({
            id: `goal-${c.id}`,
            type: 'goal_reached',
            title: '🏆 Meta atingida!',
            message: `${c.name} comprou R$ ${total.toFixed(2).replace('.', ',')} em ${goalMonths} mês/meses e ganhou ${goalPrize}!`,
            customerId: c.id,
            customerName: c.name,
            waLink: waPhone
              ? `https://wa.me/${waPhone}?text=${encodeURIComponent(
                  `Parabéns ${c.name}! 🏆🎉 Você atingiu a meta da King Store e ganhou um(a) ${goalPrize} de brinde! Entre em contato para resgatar seu presente. 🛍️`
                )}`
              : null,
            createdAt: new Date().toISOString(),
            read: false,
          })
        })
      }
    }

    const notifications = [
      ...birthdayNotifications,
      ...goalNotifications,
      ...lowStockProducts.map((p) => ({
        id: `stock-${p.id}`,
        type: 'low_stock' as const,
        title: 'Estoque baixo',
        message: `${p.name} tem apenas ${p.quantity} unidade(s)`,
        waLink: null,
        customerId: null,
        customerName: null,
        createdAt: new Date().toISOString(),
        read: false,
      })),
      ...pendingSales.map((s) => ({
        id: `pending-${s.id}`,
        type: 'pending_sale' as const,
        title: 'Venda pendente',
        message: `Venda de ${s.customer.name} aguarda confirmação`,
        waLink: null,
        customerId: null,
        customerName: null,
        createdAt: s.createdAt.toISOString(),
        read: false,
      })),
      ...recentSales.map((s) => ({
        id: `sale-${s.id}`,
        type: 'new_sale' as const,
        title: 'Nova venda',
        message: `Venda concluída para ${s.customer.name}`,
        waLink: null,
        customerId: null,
        customerName: null,
        createdAt: s.createdAt.toISOString(),
        read: true,
      })),
    ]

    return NextResponse.json({ data: notifications })
  } catch (error) {
    console.error('[NOTIFICATIONS]', error)
    return NextResponse.json({ error: 'Erro ao buscar notificações' }, { status: 500 })
  }
}
