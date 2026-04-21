import { PrismaClient, ShipmentStatus, RiskLevel } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    // Find or create a default user to own these rules
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await prisma.user.upsert({
        where: { email: 'userA_final@test.com' },
        update: {
            password: hashedPassword,
            name: 'Test Executive'
        },
        create: {
            email: 'userA_final@test.com',
            password: hashedPassword,
            name: 'Test Executive'
        }
    });

    const rules = [
        { originCountry: 'China', destinationCountry: 'UAE', minDays: 7, maxDays: 12, userId: user.id },
        { originCountry: 'China', destinationCountry: 'SA', minDays: 7, maxDays: 12, userId: user.id },
        { originCountry: 'USA', destinationCountry: 'UAE', minDays: 5, maxDays: 10, userId: user.id },
        { originCountry: 'USA', destinationCountry: 'SA', minDays: 5, maxDays: 10, userId: user.id },
        { originCountry: 'Domestic', destinationCountry: 'Domestic', minDays: 1, maxDays: 3, userId: user.id },
    ];

    for (const rule of rules) {
        const id = `${rule.userId}-${rule.originCountry}-${rule.destinationCountry}`;
        await prisma.rule.upsert({
            where: { id },
            update: rule,
            create: {
                id,
                ...rule,
            },
        });
    }

    // Seed Orders
    const ordersData = [
        // NORMAL Shipments
        { orderId: 'ORD-001', trackingNumber: 'SHP-772819', originCountry: 'China', destinationCountry: 'UAE', daysPassed: 3, status: ShipmentStatus.NORMAL, riskLevel: RiskLevel.LOW, customerName: 'John Doe', customerEmail: 'john@example.com', carrier: 'Aramex' },
        { orderId: 'ORD-002', trackingNumber: 'SHP-882910', originCountry: 'USA', destinationCountry: 'SA', daysPassed: 2, status: ShipmentStatus.NORMAL, riskLevel: RiskLevel.LOW, customerName: 'Alice Smith', customerEmail: 'alice@example.com', carrier: 'FedEx' },
        { orderId: 'ORD-003', trackingNumber: 'SHP-991021', originCountry: 'India', destinationCountry: 'UAE', daysPassed: 5, status: ShipmentStatus.NORMAL, riskLevel: RiskLevel.MEDIUM, customerName: 'Bob Wilson', customerEmail: 'bob@example.com', carrier: 'DHL' },
        { orderId: 'ORD-004', trackingNumber: 'SHP-112233', originCountry: 'UK', destinationCountry: 'KW', daysPassed: 1, status: ShipmentStatus.NORMAL, riskLevel: RiskLevel.LOW, customerName: 'Charlie Brown', customerEmail: 'charlie@example.com', carrier: 'UPS' },
        { orderId: 'ORD-005', trackingNumber: 'SHP-445566', originCountry: 'Germany', destinationCountry: 'QA', daysPassed: 4, status: ShipmentStatus.NORMAL, riskLevel: RiskLevel.LOW, customerName: 'David Lee', customerEmail: 'david@example.com', carrier: 'DHL' },
        
        // STUCK Shipments
        { orderId: 'ORD-101', trackingNumber: 'STK-552918', originCountry: 'China', destinationCountry: 'UAE', daysPassed: 15, status: ShipmentStatus.STUCK, riskLevel: RiskLevel.HIGH, customerName: 'Sarah Connor', customerEmail: 'sarah@example.com', carrier: 'FedEx', analysisNote: 'Held by customs in HK' },
        { orderId: 'ORD-102', trackingNumber: 'STK-661029', originCountry: 'USA', destinationCountry: 'SA', daysPassed: 12, status: ShipmentStatus.STUCK, riskLevel: RiskLevel.HIGH, customerName: 'Kyle Reese', customerEmail: 'kyle@example.com', carrier: 'UPS', analysisNote: 'Awaiting local clearance' },
        { orderId: 'ORD-103', trackingNumber: 'STK-771122', originCountry: 'Turkey', destinationCountry: 'UAE', daysPassed: 20, status: ShipmentStatus.STUCK, riskLevel: RiskLevel.HIGH, customerName: 'Ellen Ripley', customerEmail: 'ripley@example.com', carrier: 'Aramex', analysisNote: 'Package damaged in transit' },

        // DELAYED Shipments
        { orderId: 'ORD-201', trackingNumber: 'DLY-112299', originCountry: 'India', destinationCountry: 'SA', daysPassed: 8, status: ShipmentStatus.DELAYED, riskLevel: RiskLevel.MEDIUM, customerName: 'Peter Parker', customerEmail: 'peter@example.com', carrier: 'DHL', analysisNote: 'Flight delay in Mumbai' },
        { orderId: 'ORD-202', trackingNumber: 'DLY-334455', originCountry: 'UK', destinationCountry: 'UAE', daysPassed: 9, status: ShipmentStatus.DELAYED, riskLevel: RiskLevel.MEDIUM, customerName: 'Mary Jane', customerEmail: 'mj@example.com', carrier: 'FedEx', analysisNote: 'Incorrect sorting at hub' },
        { orderId: 'ORD-203', trackingNumber: 'DLY-556677', originCountry: 'China', destinationCountry: 'QA', daysPassed: 10, status: ShipmentStatus.DELAYED, riskLevel: RiskLevel.HIGH, customerName: 'Bruce Wayne', customerEmail: 'bruce@example.com', carrier: 'Aramex', analysisNote: 'Severe weather conditions' },

        // FRESH DELAYED Shipments (for chart visibility)
        { orderId: 'ORD-F01', trackingNumber: 'DLY-FRESH-01', originCountry: 'China', destinationCountry: 'UAE', daysPassed: 0, status: ShipmentStatus.DELAYED, riskLevel: RiskLevel.MEDIUM, customerName: 'Bruce Banner', customerEmail: 'hulk@example.com', carrier: 'DHL' },
        { orderId: 'ORD-F02', trackingNumber: 'DLY-FRESH-02', originCountry: 'India', destinationCountry: 'SA', daysPassed: 1, status: ShipmentStatus.DELAYED, riskLevel: RiskLevel.MEDIUM, customerName: 'Wanda Maximoff', customerEmail: 'wanda@example.com', carrier: 'FedEx' },

        // DELIVERED Shipments
        { orderId: 'ORD-301', trackingNumber: 'DLV-998811', originCountry: 'USA', destinationCountry: 'UAE', daysPassed: 6, status: ShipmentStatus.DELIVERED, riskLevel: RiskLevel.LOW, customerName: 'Tony Stark', customerEmail: 'tony@example.com', carrier: 'FedEx' },
        { orderId: 'ORD-302', trackingNumber: 'DLV-776655', originCountry: 'China', destinationCountry: 'SA', daysPassed: 9, status: ShipmentStatus.DELIVERED, riskLevel: RiskLevel.LOW, customerName: 'Steve Rogers', customerEmail: 'steve@example.com', carrier: 'DHL' },
        { orderId: 'ORD-303', trackingNumber: 'DLV-443322', originCountry: 'UK', destinationCountry: 'QA', daysPassed: 5, status: ShipmentStatus.DELIVERED, riskLevel: RiskLevel.LOW, customerName: 'Natasha Romanoff', customerEmail: 'natasha@example.com', carrier: 'UPS' },
    ];

    for (const order of ordersData) {
        await prisma.order.upsert({
            where: {
                trackingNumber_userId: {
                    trackingNumber: order.trackingNumber,
                    userId: user.id
                }
            },
            update: {
                ...order,
                userId: user.id,
                shippedDate: new Date(Date.now() - order.daysPassed * 24 * 60 * 60 * 1000)
            },
            create: {
                ...order,
                userId: user.id,
                shippedDate: new Date(Date.now() - order.daysPassed * 24 * 60 * 60 * 1000)
            }
        });
    }

    console.log('Seeded rules and orders for user:', user.email);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
