const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  console.log('🗑️  Limpando dados...')
  await p.activity.deleteMany()
  await p.stockMovement.deleteMany()
  await p.saleItem.deleteMany()
  await p.sale.deleteMany()
  await p.expense.deleteMany()
  await p.customer.deleteMany()
  await p.product.deleteMany()
  console.log('✅ Banco limpo! Apenas o usuário admin foi mantido.')
}

main().catch(console.error).finally(() => p.$disconnect())
