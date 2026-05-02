import { PrismaClient, SaleStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@kingstore.com' },
    update: {},
    create: {
      name: 'Admin King',
      email: 'admin@kingstore.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })
  console.log('✅ User created:', admin.email)

  // Products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { id: 'prod-1' },
      update: {},
      create: {
        id: 'prod-1',
        name: 'Smartphone Galaxy S24',
        description: 'Smartphone top de linha com câmera de 200MP',
        price: 3999.99,
        quantity: 25,
        category: 'Eletrônicos',
      },
    }),
    prisma.product.upsert({
      where: { id: 'prod-2' },
      update: {},
      create: {
        id: 'prod-2',
        name: 'Notebook Dell Inspiron',
        description: 'Notebook i7, 16GB RAM, SSD 512GB',
        price: 4500.00,
        quantity: 15,
        category: 'Informática',
      },
    }),
    prisma.product.upsert({
      where: { id: 'prod-3' },
      update: {},
      create: {
        id: 'prod-3',
        name: 'Fone Sony WH-1000XM5',
        description: 'Headphone com cancelamento de ruído',
        price: 1299.99,
        quantity: 40,
        category: 'Áudio',
      },
    }),
    prisma.product.upsert({
      where: { id: 'prod-4' },
      update: {},
      create: {
        id: 'prod-4',
        name: 'Smart TV LG 55"',
        description: 'TV 4K OLED com WebOS',
        price: 5200.00,
        quantity: 8,
        category: 'TVs',
      },
    }),
    prisma.product.upsert({
      where: { id: 'prod-5' },
      update: {},
      create: {
        id: 'prod-5',
        name: 'iPad Pro 12.9"',
        description: 'Tablet Apple com chip M2',
        price: 8999.00,
        quantity: 12,
        category: 'Tablets',
      },
    }),
    prisma.product.upsert({
      where: { id: 'prod-6' },
      update: {},
      create: {
        id: 'prod-6',
        name: 'Mouse Logitech MX Master 3',
        description: 'Mouse ergonômico sem fio',
        price: 499.99,
        quantity: 60,
        category: 'Periféricos',
      },
    }),
  ])
  console.log('✅ Products created:', products.length)

  // Customers
  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { email: 'joao.silva@email.com' },
      update: {},
      create: {
        id: 'cust-1',
        name: 'João Silva',
        email: 'joao.silva@email.com',
        phone: '(11) 99999-0001',
        address: 'Rua das Flores, 123 - São Paulo, SP',
      },
    }),
    prisma.customer.upsert({
      where: { email: 'maria.santos@email.com' },
      update: {},
      create: {
        id: 'cust-2',
        name: 'Maria Santos',
        email: 'maria.santos@email.com',
        phone: '(21) 99999-0002',
        address: 'Av. Copacabana, 456 - Rio de Janeiro, RJ',
      },
    }),
    prisma.customer.upsert({
      where: { email: 'pedro.oliveira@email.com' },
      update: {},
      create: {
        id: 'cust-3',
        name: 'Pedro Oliveira',
        email: 'pedro.oliveira@email.com',
        phone: '(31) 99999-0003',
        address: 'Rua da Liberdade, 789 - Belo Horizonte, MG',
      },
    }),
    prisma.customer.upsert({
      where: { email: 'ana.costa@email.com' },
      update: {},
      create: {
        id: 'cust-4',
        name: 'Ana Costa',
        email: 'ana.costa@email.com',
        phone: '(41) 99999-0004',
        address: 'Av. Batel, 321 - Curitiba, PR',
      },
    }),
    prisma.customer.upsert({
      where: { email: 'carlos.ferreira@email.com' },
      update: {},
      create: {
        id: 'cust-5',
        name: 'Carlos Ferreira',
        email: 'carlos.ferreira@email.com',
        phone: '(51) 99999-0005',
        address: 'Rua Garibaldi, 654 - Porto Alegre, RS',
      },
    }),
  ])
  console.log('✅ Customers created:', customers.length)

  // Sales
  const sale1 = await prisma.sale.create({
    data: {
      total: 5299.98,
      status: SaleStatus.COMPLETED,
      notes: 'Pagamento via cartão de crédito',
      customerId: 'cust-1',
      userId: admin.id,
      items: {
        create: [
          { productId: 'prod-1', quantity: 1, price: 3999.99 },
          { productId: 'prod-3', quantity: 1, price: 1299.99 },
        ],
      },
    },
  })

  const sale2 = await prisma.sale.create({
    data: {
      total: 4500.00,
      status: SaleStatus.COMPLETED,
      notes: 'Pagamento via PIX',
      customerId: 'cust-2',
      userId: admin.id,
      items: {
        create: [
          { productId: 'prod-2', quantity: 1, price: 4500.00 },
        ],
      },
    },
  })

  const sale3 = await prisma.sale.create({
    data: {
      total: 999.98,
      status: SaleStatus.COMPLETED,
      customerId: 'cust-3',
      userId: admin.id,
      items: {
        create: [
          { productId: 'prod-6', quantity: 2, price: 499.99 },
        ],
      },
    },
  })

  const sale4 = await prisma.sale.create({
    data: {
      total: 8999.00,
      status: SaleStatus.PENDING,
      notes: 'Aguardando confirmação de pagamento',
      customerId: 'cust-4',
      userId: admin.id,
      items: {
        create: [
          { productId: 'prod-5', quantity: 1, price: 8999.00 },
        ],
      },
    },
  })

  console.log('✅ Sales created:', [sale1, sale2, sale3, sale4].length)
  console.log('\n🎉 Seed completed!')
  console.log('\n📋 Login credentials:')
  console.log('   Email: admin@kingstore.com')
  console.log('   Password: admin123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
