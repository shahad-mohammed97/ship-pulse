
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixRulesAndRecalculate() {
  console.log('Fixing rule names to ISO codes...');
  
  // Fix China -> UAE
  await prisma.rule.updateMany({
    where: { originCountry: 'China', destinationCountry: 'United Arab Emirates' },
    data: { originCountry: 'CN', destinationCountry: 'AE' }
  });

  // Fix Afghanistan -> Albania
  await prisma.rule.updateMany({
    where: { originCountry: 'Afghanistan', destinationCountry: 'Albania' },
    data: { originCountry: 'AF', destinationCountry: 'AL' }
  });

  console.log('Rules updated. Triggering status recalculation for the user...');

  // Get the user ID from the shipment
  const order = await prisma.order.findFirst({
    where: { trackingNumber: '456316812382' }
  });

  if (order) {
    const userId = order.userId;
    const orders = await prisma.order.findMany({ where: { userId } });
    const allRules = await prisma.rule.findMany({ where: { userId } });
    const now = new Date();

    for (const o of orders) {
        // Simple logic mirroring orders.service.ts
        const getMatchingRule = () => {
            const userRules = allRules;
            const routeCarrier = userRules.find(r => 
                r.originCountry === o.originCountry && 
                r.destinationCountry === o.destinationCountry && 
                r.carrier === o.carrier
            );
            if (routeCarrier) return routeCarrier;

            const routeSpec = userRules.find(r => 
                r.originCountry === o.originCountry && 
                r.destinationCountry === o.destinationCountry &&
                (!r.carrier || r.carrier === '')
            );
            if (routeSpec) return routeSpec;

            return userRules.find(r => r.originCountry === 'Global' && r.destinationCountry === 'Global');
        };

        const rule = getMatchingRule();
        
        // Calculate status (mirroring provide function)
        const shippedDate = new Date(o.shippedDate);
        const lastUpdateRef = o.lastUpdateDate ? new Date(o.lastUpdateDate) : shippedDate;
        const daysSinceLastUpdate = Math.floor((now.getTime() - lastUpdateRef.getTime()) / (1000 * 60 * 60 * 24));
        const daysPassed = Math.floor((now.getTime() - shippedDate.getTime()) / (1000 * 60 * 60 * 24));

        const stuckThreshold = rule ? rule.stuckDays : 3;
        const delayedThreshold = rule ? rule.minDays : 7;

        let status = 'NORMAL';
        let riskLevel = 'LOW';

        if (o.aftershipStatus === 'Delivered') {
            status = 'DELIVERED';
        } else if (daysSinceLastUpdate > stuckThreshold) {
            status = 'STUCK';
            riskLevel = 'MEDIUM';
        } else if (daysPassed > delayedThreshold) {
            status = 'DELAYED';
            riskLevel = 'MEDIUM';
        }
        
        console.log(`Order ${o.trackingNumber}: Status -> ${status} (Thresh: ${stuckThreshold}d, Passed: ${daysSinceLastUpdate}d)`);

        await prisma.order.update({
            where: { id: o.id },
            data: { status, riskLevel, analysisNote: rule?.customMessage || null }
        });
    }
    console.log('Recalculation complete.');
  } else {
    console.log('Shipment not found.');
  }
}

fixRulesAndRecalculate().finally(() => prisma.$disconnect());
