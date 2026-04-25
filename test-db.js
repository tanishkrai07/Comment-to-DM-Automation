const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const pages = await prisma.page.findMany()
  console.log("Pages in DB:", pages)
}
main()
