import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import csv from 'csv-parser';
import { CarrierDetectionService } from './carrier-detection.service';
import { Readable } from 'stream';
import { ShipmentStatus, RiskLevel, Order } from '@prisma/client';
import { Cron } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { MailService } from '../mail/mail.service';

@Injectable()
export class OrdersService {
    constructor(
        private prisma: PrismaService,
        @InjectQueue('tracking') private trackingQueue: Queue,
        private carrierDetector: CarrierDetectionService,
        private mailService: MailService,
    ) { }

    async processCsv(fileBuffer: Buffer, userId: string): Promise<Order[]> {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new Error('User session is invalid. Please log out and log in again.');
        }

        const results: any[] = [];
        const stream = Readable.from(fileBuffer);

        return new Promise((resolve, reject) => {
            stream
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', async () => {
                    try {
                        const processedOrders = await this.processOrders(results, userId);
                        resolve(processedOrders);
                    } catch (error) {
                        reject(error);
                    }
                })
                .on('error', (error) => reject(error));
        });
    }

    private async processOrders(rawData: any[], userId: string): Promise<Order[]> {
        const rules = await this.prisma.rule.findMany({ where: { userId } });
        const now = new Date();
        const processed: Order[] = [];

        console.log(`Processing ${rawData.length} rows from CSV...`);

        for (const [index, row] of rawData.entries()) {
            try {
                const orderId = row.order_id?.trim();
                const trackingNumber = (row.tracking_number || row.trackingNumber)?.trim();
                let originCountry = (row.origin_country || row.origin || row.originCountry)?.trim();
                let destinationCountry = (row.destination_country || row.destination || row.destinationCountry)?.trim();
                const customerName = (row.customer_name || row.customerName || row.name)?.trim();
                const customerEmail = (row.customer_email || row.email || row.customerEmail)?.trim();
                const customerPhone = (row.customer_phone || row.phone || row.customerPhone)?.trim();
                const customerAddress = (row.customer_address || row.address || row.customerAddress)?.trim();
                let carrier = (row.carrier || row.shipping_provider || row.shipping_company || row.provider)?.trim();
                let carrierUrl = (row.carrier_url || row.carrierUrl || row.tracking_url)?.trim();
                const shippingType = (row.shipping_type || row.type)?.trim();

                // Intelligent Carrier & Country Detection
                if (trackingNumber) {
                    const detected = this.carrierDetector.detect(trackingNumber);
                    if (!carrier && detected.carrier) carrier = detected.carrier;
                    if (!destinationCountry && detected.country) destinationCountry = detected.country;
                    if (!carrierUrl && detected.url) carrierUrl = detected.url;
                }

                // Fallback for mandatory Prisma fields
                if (!originCountry) originCountry = 'Global';
                if (!destinationCountry) destinationCountry = 'Global';

                const missingFields = [];
                if (!trackingNumber) missingFields.push('Tracking Number');
                if (!row.shipped_date) missingFields.push('Shipped Date');
                if (!customerEmail) missingFields.push('Customer Email');

                if (missingFields.length > 0) {
                    throw new Error(`Row ${index + 1}: Missing mandatory fields: ${missingFields.join(', ')}`);
                }

                const finalOrderId = orderId || trackingNumber;
                const shippedDate = new Date(row.shipped_date);
                if (isNaN(shippedDate.getTime())) {
                    throw new Error(`Row ${index + 1}: Invalid shipped date format: ${row.shipped_date}`);
                }

                const lastUpdateDate = row.last_update_date ? new Date(row.last_update_date) : null;
                const daysPassed = Math.floor((now.getTime() - shippedDate.getTime()) / (1000 * 60 * 60 * 24));

                // Improved Rule Matching Logic
                const getMatchingRule = () => {
                    // 1. Most Specific: Origin + Destination + Carrier
                    const routeCarrier = rules.find(r => 
                        r.originCountry === originCountry && 
                        r.destinationCountry === destinationCountry && 
                        r.carrier === carrier
                    );
                    if (routeCarrier) return routeCarrier;

                    // 2. Route Specific: Origin + Destination
                    const routeSpec = rules.find(r => 
                        r.originCountry === originCountry && 
                        r.destinationCountry === destinationCountry &&
                        !r.carrier
                    );
                    if (routeSpec) return routeSpec;

                    // 3. Fallback to Global Default
                    return rules.find(r => r.originCountry === 'Global' && r.destinationCountry === 'Global');
                };

                const rule = getMatchingRule();
                const { status, riskLevel } = this.calculateStatus({
                    shippedDate,
                    lastUpdateDate: (lastUpdateDate && !isNaN(lastUpdateDate.getTime())) ? lastUpdateDate : null,
                    aftershipStatus: row.aftershipStatus || null
                }, rule, now);

                const analysisNote = rule?.customMessage || null;

                const order = await this.prisma.order.upsert({
                    where: { 
                        trackingNumber_userId: {
                            trackingNumber: trackingNumber,
                            userId: userId
                        }
                    },
                    create: {
                        orderId: finalOrderId,
                        trackingNumber,
                        originCountry,
                        destinationCountry,
                        shippedDate,
                        lastUpdateDate: (lastUpdateDate && !isNaN(lastUpdateDate.getTime())) ? lastUpdateDate : null,
                        daysPassed,
                        status,
                        riskLevel,
                        customerName,
                        customerEmail,
                        customerPhone,
                        customerAddress,
                        carrier,
                        carrierUrl,
                        shippingType,
                        analysisNote,
                        userId,
                    },
                    update: {
                        orderId: finalOrderId, 
                        originCountry,
                        destinationCountry,
                        shippedDate,
                        lastUpdateDate: (lastUpdateDate && !isNaN(lastUpdateDate.getTime())) ? lastUpdateDate : null,
                        daysPassed,
                        status,
                        riskLevel,
                        analysisNote,
                        updatedAt: new Date(),
                        customerName,
                        customerEmail,
                        customerPhone,
                        customerAddress,
                        carrier,
                        carrierUrl,
                        shippingType,
                        userId,
                    },
                });
                processed.push(order);

                // Enqueue AfterShip sync job
                await this.trackingQueue.add('sync', { 
                    orderId: order.id, 
                    userId 
                }, {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 5000 }
                });

            } catch (error) {
                if (error.message.includes('Missing mandatory fields') || error.message.includes('Invalid shipped date')) {
                    throw error;
                }
                console.error(`Error processing row ${index + 1}:`, error);
                throw new Error(`Row ${index + 1}: Database error during save - ${error.message}`);
            }
        }

        console.log(`Successfully processed ${processed.length} out of ${rawData.length} rows.`);
        return processed;
    }

    async createSingleOrder(userId: string, data: any): Promise<Order> {
        const now = new Date();
        const trackingNumber = data.trackingNumber?.trim();
        let carrier = data.carrier?.trim();
        let originCountry = data.originCountry?.trim() || 'Global';
        let destinationCountry = data.destinationCountry?.trim();
        const shippedDate = new Date(data.shippedDate);

        if (!trackingNumber || !data.shippedDate || !data.customerEmail) {
            throw new Error('Mandatory fields missing: Tracking Number, Shipped Date, and Customer Email are required.');
        }

        if (isNaN(shippedDate.getTime())) {
            throw new Error('Invalid shipped date format.');
        }

        // Auto-detect if needed
        if (trackingNumber) {
            const detected = this.carrierDetector.detect(trackingNumber);
            if (!carrier && detected.carrier) carrier = detected.carrier;
            if (!destinationCountry && detected.country) destinationCountry = detected.country;
        }

        if (!destinationCountry) destinationCountry = 'Global';

        const rules = await this.prisma.rule.findMany({ where: { userId } });
        const getMatchingRule = () => {
            const routeCarrier = rules.find(r => 
                r.originCountry === originCountry && 
                r.destinationCountry === destinationCountry && 
                r.carrier === carrier
            );
            if (routeCarrier) return routeCarrier;

            const routeSpec = rules.find(r => 
                r.originCountry === originCountry && 
                r.destinationCountry === destinationCountry &&
                !r.carrier
            );
            if (routeSpec) return routeSpec;

            return rules.find(r => r.originCountry === 'Global' && r.destinationCountry === 'Global');
        };

        const rule = getMatchingRule();
        const { status, riskLevel } = this.calculateStatus({
            shippedDate,
            lastUpdateDate: null,
            aftershipStatus: null
        }, rule, now);

        const daysPassed = Math.floor((now.getTime() - shippedDate.getTime()) / (1000 * 60 * 60 * 24));

        const order = await this.prisma.order.upsert({
            where: { 
                trackingNumber_userId: {
                    trackingNumber: trackingNumber,
                    userId: userId
                }
            },
            create: {
                userId,
                orderId: data.orderId || trackingNumber,
                trackingNumber,
                originCountry,
                destinationCountry,
                shippedDate,
                daysPassed,
                status,
                riskLevel,
                customerName: data.customerName,
                customerEmail: data.customerEmail,
                customerPhone: data.customerPhone,
                customerAddress: data.customerAddress,
                carrier,
                analysisNote: rule?.customMessage || null,
            },
            update: {
                orderId: data.orderId || trackingNumber,
                originCountry,
                destinationCountry,
                shippedDate,
                daysPassed,
                status,
                riskLevel,
                customerName: data.customerName,
                customerEmail: data.customerEmail,
                customerPhone: data.customerPhone,
                customerAddress: data.customerAddress,
                carrier,
                analysisNote: rule?.customMessage || null,
            }
        });

        // Enqueue for tracking
        await this.trackingQueue.add('sync-tracking', {
            orderId: order.id,
            userId: userId,
        });

        return order;
    }

    async syncTracking(id: string, userId: string) {
        const order = await this.prisma.order.findFirst({
            where: { id, userId }
        });
        if (!order) throw new Error('Order not found');

        await this.trackingQueue.add('sync', { orderId: id, userId }, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 }
        });
        return { success: true, message: 'Sync job enqueued' };
    }

    async getDashboardStats(userId: string) {
        if (!userId) throw new Error('UserId is required');
        const total = await this.prisma.order.count({ where: { userId } });
        const delayed = await this.prisma.order.count({ where: { userId, status: ShipmentStatus.DELAYED } });
        const stuck = await this.prisma.order.count({ where: { userId, status: ShipmentStatus.STUCK } });
        const delivered = await this.prisma.order.count({ where: { userId, status: ShipmentStatus.DELIVERED } });
        const normal = await this.prisma.order.count({ where: { userId, status: ShipmentStatus.NORMAL } });

        // Delayed by Day of Week Analysis
        const delayedOrders = await this.prisma.order.findMany({
            where: { userId, status: ShipmentStatus.DELAYED },
            select: { shippedDate: true }
        });

        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const counts = new Array(7).fill(0);

        delayedOrders.forEach(order => {
            const day = new Date(order.shippedDate).getDay();
            counts[day]++;
        });

        const delayedTrends = dayNames.map((name, index) => ({
            name,
            count: counts[index]
        }));

        return { total, delayed, stuck, delivered, normal, delayedTrends };
    }

    async recalculateUserOrders(userId: string) {
        console.log(`Recalculating shipment statuses for user: ${userId}...`);
        const orders = await this.prisma.order.findMany({ where: { userId } });
        const userRules = await this.prisma.rule.findMany({ where: { userId } });
        const now = new Date();

        for (const order of orders) {
            const getMatchingRule = () => {
                const routeCarrier = userRules.find(r => 
                    r.originCountry === order.originCountry && 
                    r.destinationCountry === order.destinationCountry && 
                    r.carrier === (order as any).carrier
                );
                if (routeCarrier) return routeCarrier;

                const routeSpec = userRules.find(r => 
                    r.originCountry === order.originCountry && 
                    r.destinationCountry === order.destinationCountry &&
                    !r.carrier
                );
                if (routeSpec) return routeSpec;

                return userRules.find(r => r.originCountry === 'Global' && r.destinationCountry === 'Global');
            };

            const rule = getMatchingRule();
            const { status, riskLevel } = this.calculateStatus(order, rule, now);

            await this.prisma.order.update({
                where: { id: order.id },
                data: {
                    daysPassed: Math.floor((now.getTime() - order.shippedDate.getTime()) / (1000 * 60 * 60 * 24)),
                    status,
                    riskLevel,
                    analysisNote: rule?.customMessage || null,
                },
            });
        }
        console.log(`Recalculated status for ${orders.length} orders for user ${userId}.`);
    }

    @Cron('0 * * * *') // Every hour
    async reprocessAllOrders() {
        console.log('Running hourly shipment status recalculation...');
        const orders = await this.prisma.order.findMany();
        const allRules = await this.prisma.rule.findMany();
        const now = new Date();

        for (const order of orders) {
            const getMatchingRule = () => {
                const userRules = allRules.filter(r => r.userId === order.userId);
                const routeCarrier = userRules.find(r => 
                    r.originCountry === order.originCountry && 
                    r.destinationCountry === order.destinationCountry && 
                    r.carrier === (order as any).carrier
                );
                if (routeCarrier) return routeCarrier;

                const routeSpec = userRules.find(r => 
                    r.originCountry === order.originCountry && 
                    r.destinationCountry === order.destinationCountry &&
                    !r.carrier
                );
                if (routeSpec) return routeSpec;

                return userRules.find(r => r.originCountry === 'Global' && r.destinationCountry === 'Global');
            };

            const rule = getMatchingRule();
            const { status, riskLevel } = this.calculateStatus(order, rule, now);

            await this.prisma.order.update({
                where: { id: order.id },
                data: {
                    daysPassed: Math.floor((now.getTime() - order.shippedDate.getTime()) / (1000 * 60 * 60 * 24)),
                    status,
                    riskLevel,
                    analysisNote: rule?.customMessage || null,
                },
            });
        }
        console.log(`Recalculated status for ${orders.length} orders.`);
    }

    async getAllOrders(userId: string, search?: string) {
        if (!userId) throw new Error('UserId is required');
        
        const where: any = { userId };
        
        if (search) {
            where.OR = [
                { trackingNumber: { contains: search, mode: 'insensitive' } },
                { customerEmail: { contains: search, mode: 'insensitive' } },
                { orderId: { contains: search, mode: 'insensitive' } },
                { customerName: { contains: search, mode: 'insensitive' } }
            ];
        }

        return this.prisma.order.findMany({
            where,
            orderBy: { updatedAt: 'desc' },
        });
    }

    public calculateStatus(order: any, rule: any, now: Date): { status: ShipmentStatus, riskLevel: RiskLevel } {
        // 1. AfterShip Overrides (Priority 1)
        if (order.aftershipStatus === 'Delivered') {
            return { status: ShipmentStatus.DELIVERED, riskLevel: RiskLevel.LOW };
        }

        const shippedDate = new Date(order.shippedDate);
        const lastUpdateDate = order.lastUpdateDate ? new Date(order.lastUpdateDate) : null;
        const daysPassed = Math.floor((now.getTime() - shippedDate.getTime()) / (1000 * 60 * 60 * 24));

        let status: ShipmentStatus = ShipmentStatus.NORMAL;
        let riskLevel: RiskLevel = RiskLevel.LOW;

        const delayedThreshold = rule ? rule.minDays : 7;
        const stuckThreshold = rule ? rule.stuckDays : 3;

        const lastUpdateRef = lastUpdateDate || shippedDate;
        const daysSinceLastUpdate = Math.floor((now.getTime() - lastUpdateRef.getTime()) / (1000 * 60 * 60 * 24));

        // 2. Stuck Check (Priority 2) - Inactive in same station
        if (daysSinceLastUpdate > stuckThreshold) {
            status = ShipmentStatus.STUCK;
            riskLevel = RiskLevel.MEDIUM;
        } 
        // 3. Delayed Check (Priority 3) - Total transit time
        else if (daysPassed > delayedThreshold) {
            status = ShipmentStatus.DELAYED;
            riskLevel = RiskLevel.MEDIUM;
        }

        return { status, riskLevel };
    }

    async notifyCustomer(orderId: string, userId: string, message: string) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { user: true }
        });

        if (!order || order.userId !== userId) {
            throw new Error('Order not found or access denied');
        }

        if (!order.customerEmail) {
            throw new Error('Customer email not found for this order');
        }

        const subject = `Update regarding your order #${order.orderId}`;
        const senderName = order.user.name || 'ShipPulse Team';
        const senderEmail = order.user.email;

        await this.mailService.sendEmail(
            order.customerEmail,
            subject,
            message,
            senderName,
            senderEmail
        );

        return { success: true, message: 'Notification sent successfully' };
    }

    async updateOrder(orderId: string, userId: string, data: any) {
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, userId }
        });
        if (!order) throw new Error('Order not found or access denied');

        // Merge existing order with new data to have complete object for calculation
        const updatedOrderData = { ...order, ...data };
        if (data.shippedDate) updatedOrderData.shippedDate = new Date(data.shippedDate);

        // Fetch rules to recalculate status
        const rules = await this.prisma.rule.findMany({ where: { userId } });
        const now = new Date();

        const getMatchingRule = () => {
            const origin = updatedOrderData.originCountry;
            const dest = updatedOrderData.destinationCountry;
            const carrier = updatedOrderData.carrier;

            const routeCarrier = rules.find(r => 
                r.originCountry === origin && 
                r.destinationCountry === dest && 
                r.carrier === carrier
            );
            if (routeCarrier) return routeCarrier;

            const routeSpec = rules.find(r => 
                r.originCountry === origin && 
                r.destinationCountry === dest &&
                !r.carrier
            );
            if (routeSpec) return routeSpec;

            return rules.find(r => r.originCountry === 'Global' && r.destinationCountry === 'Global');
        };

        const rule = getMatchingRule();
        const { status, riskLevel } = this.calculateStatus(updatedOrderData, rule, now);

        return this.prisma.order.update({
            where: { id: orderId },
            data: {
                ...data,
                status,
                riskLevel,
                updatedAt: new Date()
            }
        });
    }

    async deleteOrder(orderId: string, userId: string) {
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, userId }
        });
        if (!order) throw new Error('Order not found or access denied');

        return this.prisma.order.delete({
            where: { id: orderId }
        });
    }
}
