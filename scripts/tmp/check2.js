const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function main() {
  const sales = await prisma.sale.findMany({
    select: { id:true, total:true, createdAt:true, customerId:true, customer:{select:{name:true}}, items:{select:{productId:true,quantity:true,price:true}} },
    orderBy: { createdAt: 'desc' },
  })
  // group by same total+items+time proximity
  const map = {}
  for (const s of sales) {
    const key = s.total + '|' + JSON.stringify(s.items)
    map[key] = map[key] || []
    map[key].push(s)
  }
  for (const [k,v] of Object.entries(map)) {
    if (v.length > 1) console.log('DUP-ish group:', k, v.map(s=>({id:s.id, customer:s.customer.name, createdAt:s.createdAt})))
  }
}
main().finally(()=>prisma.$disconnect())
