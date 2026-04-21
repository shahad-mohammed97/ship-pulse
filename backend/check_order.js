
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkShipment() {
  const order = await prisma.order.findFirst({
    where: { trackingNumber: '456316812382' }
  });
  console.log('Order Details:', JSON.stringify(order, null, 2));

  if (order) {
    const rules = await prisma.rule.findMany({
      where: { userId: order.userId }
    });
    console.log('User Rules:', JSON.stringify(rules, null, 2));
  }
}

checkShipment().finally(() => prisma.$disconnect());
