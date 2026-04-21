import { Injectable, Logger } from '@nestjs/common';
// @ts-ignore
import { AfterShip } from 'aftership';

@Injectable()
export class AfterShipService {
  private readonly aftership: any;
  private readonly logger = new Logger(AfterShipService.name);

  constructor() {
    // In a real app, this would come from ConfigService
    const apiKey = process.env.AFTERSHIP_API_KEY || 'YOUR_AFTERSHIP_API_KEY';
    this.aftership = new AfterShip(apiKey);
  }

  async createTracking(trackingNumber: string, carrier?: string, orderId?: string): Promise<any> {
    try {
      const payload: any = {
        tracking_number: trackingNumber,
      };

      if (carrier) payload.slug = carrier.toLowerCase();
      if (orderId) payload.order_id = orderId;

      const result = await this.aftership.tracking.createTracking(payload);
      return result.data.tracking;
    } catch (error) {
      this.logger.error(`Error creating tracking for ${trackingNumber}: ${error.message}`);
      
      // If already exists, return null so processor falls back to getTrackingByNumber
      if (error.message?.includes('already exists') || error.type === 'AlreadyExists') {
          return null;
      }

      // If slug is invalid, retry without the slug so Aftership auto-detects it
      if (carrier && error.message?.includes('`slug` is invalid')) {
          this.logger.log(`Retrying ${trackingNumber} without invalid slug: ${carrier}`);
          return this.createTracking(trackingNumber, undefined, orderId);
      }
      
      // The request was invalid or cannot be otherwise served. (happens with unsupported couriers/numbers)
      if (error.message?.includes('invalid or cannot be otherwise served')) {
          return null; // Return null so we just ignore and don't crash
      }

      throw error;
    }
  }

  async getTracking(id: string): Promise<any> {
    try {
      const result = await this.aftership.tracking.getTracking({ id });
      return result.data.tracking;
    } catch (error) {
      this.logger.error(`Error fetching tracking ${id}: ${error.message}`);
      throw error;
    }
  }

  async getTrackingByNumber(trackingNumber: string, slug?: string): Promise<any> {
      try {
          const params: any = { tracking_number: trackingNumber };
          if (slug) params.slug = slug.toLowerCase();
          
          const result = await this.aftership.tracking.getTracking(params);
          return result.data.tracking;
      } catch (error) {
           this.logger.error(`Error fetching tracking ${trackingNumber}: ${error.message}`);
           
           if (error.type === 'NotFound' || error.message?.includes('specify both slug and tracking number')) {
               this.logger.log(`Falling back to listTrackings for ${trackingNumber} without strict slug...`);
               try {
                   const listResult = await this.aftership.tracking.listTrackings({ tracking_numbers: trackingNumber });
                   if (listResult.data && listResult.data.trackings && listResult.data.trackings.length > 0) {
                       return listResult.data.trackings[0];
                   }
               } catch (fallbackError) {
                   this.logger.error(`List fallback failed for ${trackingNumber}: ${fallbackError.message}`);
               }
           }
           
           return null;
      }
  }
}
