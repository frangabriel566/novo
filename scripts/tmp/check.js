const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function main() {
  const sales = await prisma.sale.findMany({ select: { id:true, total:true, createdAt:true, status:true }, orderBy: { createdAt: 'desc' }, take: 20 })
  console.log(JSON.stringify(sales, null, 2))
  const count = await prisma.sale.count()
  console.log('total sales', count)
}
main().finally(()=>prisma.$disconnect())
