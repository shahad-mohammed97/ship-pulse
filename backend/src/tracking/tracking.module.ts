import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AfterShipService } from './aftership.service';
import { TrackingProcessor } from './tracking.processor';
import { TrackingGateway } from './tracking.gateway';
import { OrdersModule } from '../orders/orders.module';
import { PrismaModule } from '../prisma/prisma.module';
import { forwardRef } from '@nestjs/common';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'tracking',
    }),
    PrismaModule,
    forwardRef(() => OrdersModule),
  ],
  providers: [AfterShipService, TrackingProcessor, TrackingGateway],
  exports: [AfterShipService, BullModule],
})
export class TrackingModule {}
