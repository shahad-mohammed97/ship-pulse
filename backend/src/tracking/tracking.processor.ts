import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { AfterShipService } from './aftership.service';
import { PrismaService } from '../prisma/prisma.service';
import { TrackingGateway } from './tracking.gateway';

@Processor('tracking')
export class TrackingProcessor extends WorkerHost {
  private readonly logger = new Logger(TrackingProcessor.name);

  constructor(
    private readonly aftership: AfterShipService,
    private readonly prisma: PrismaService,
    private readonly gateway: TrackingGateway,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { orderId, userId } = job.data;
    this.logger.log(`Processing tracking sync for order: ${orderId}`);

    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        this.logger.error(`Order not found: ${orderId}`);
        return;
      }

      // 0. Map Carrier to AfterShip Slug
      const SLUG_MAP: Record<string, string> = {
        'amazon logistics': 'amazon',
        'royal mail': 'royal-mail',
        'pitney bowes': 'pitney-bowes',
        'dhl': 'dhl',
        'fedex': 'fedex',
        'usps': 'usps',
        'ups': 'ups',
        'orange connex': 'orange-connex',
        'yunexpress': 'yunexpress',
        'aramex': 'aramex',
        'yanwen': 'yanwen',
        '4px': '4px',
        'sunyou': 'sunyou',
        'uniuni': 'uniuni'
      };

      let mappedSlug: string | undefined = undefined;
      if (order.carrier) {
          const lowerCarrier = order.carrier.toLowerCase().trim();
          mappedSlug = SLUG_MAP[lowerCarrier] || lowerCarrier.replace(/\s+/g, '-');
      }

      // 1. Initial registration in AfterShip if not already done
      let aftershipData;
      if (!order.aftershipId) {
        aftershipData = await this.aftership.createTracking(
          order.trackingNumber,
          mappedSlug,
          order.orderId
        );
        
        if (aftershipData) {
            await this.prisma.order.update({
                where: { id: order.id },
                data: {
                    aftershipId: aftershipData.id,
                    aftershipStatus: aftershipData.tag,
                }
            });
        } else {
             // If creation failed but it already exists, try to find it
             aftershipData = await this.aftership.getTrackingByNumber(order.trackingNumber, mappedSlug);
             if (aftershipData) {
                 await this.prisma.order.update({
                     where: { id: order.id },
                     data: {
                         aftershipId: aftershipData.id,
                         aftershipStatus: aftershipData.tag,
                     }
                 });
             }
        }
      } else {
          // 2. Fetch latest if we already have ID
          aftershipData = await this.aftership.getTracking(order.aftershipId);
      }

      if (aftershipData) {
        // 3. Update DB with latest data
        const updatedData: any = {
            aftershipStatus: aftershipData.tag,
            lastSyncAt: new Date(),
        };

        if (aftershipData.transit_time !== undefined && aftershipData.transit_time !== null) {
            updatedData.transitTime = aftershipData.transit_time;
        }

        // Only override if AfterShip gives us a specifically recognized country
        if (aftershipData.origin_country_iso3 && aftershipData.origin_country_iso3 !== 'UNK') {
            updatedData.originCountry = aftershipData.origin_country_iso3;
        }
        if (aftershipData.destination_country_iso3 && aftershipData.destination_country_iso3 !== 'UNK') {
            updatedData.destinationCountry = aftershipData.destination_country_iso3;
        }

        const updatedOrder = await this.prisma.order.update({
          where: { id: order.id },
          data: updatedData,
        });

        // 4. Notify frontend via WebSockets
        this.gateway.notifyStatusUpdate(userId, updatedOrder);
      }

      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to process tracking ${orderId}: ${error.message}`);
      throw error; // Let BullMQ retry
    }
  }
}
