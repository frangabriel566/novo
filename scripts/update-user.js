const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const p = new PrismaClient()

async function main() {
  const hash = await bcrypt.hash('carvalho123', 12)
  const user = await p.user.update({
    where: { email: 'admin@kingstore.com' },
    data: { name: 'Carvalho', password: hash }
  })
  console.log('✅ Usuário atualizado:', user.name)
}

main().catch(console.error).finally(() => p.$disconnect())
