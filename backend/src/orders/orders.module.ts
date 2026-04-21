import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';

import { PrismaModule } from '../prisma/prisma.module';
import { TrackingModule } from '../tracking/tracking.module';
import { forwardRef } from '@nestjs/common';

import { CarrierDetectionService } from './carrier-detection.service';

import { MailModule } from '../mail/mail.module';

@Module({
  imports: [PrismaModule, forwardRef(() => TrackingModule), MailModule],
  providers: [OrdersService, CarrierDetectionService],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
