import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Rule, Prisma } from '@prisma/client';

import { RulesService as RulesServiceBase } from './rules.service'; // This is just to avoid shadowing if needed, but not necessary here
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class RulesService {
  constructor(
    private prisma: PrismaService,
    private ordersService: OrdersService,
  ) {}

  async findAll(userId: string): Promise<Rule[]> {
    let rules = await this.prisma.rule.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (rules.length === 0 || !rules.find(r => r.originCountry === 'Global' && r.destinationCountry === 'Global')) {
      const defaultRule = await this.prisma.rule.create({
        data: {
          originCountry: 'Global',
          destinationCountry: 'Global',
          minDays: 7,
          maxDays: 14,
          customMessage: 'Your shipment is currently in transit. We are monitoring it for you.',
          userId,
        },
      });
      rules = [defaultRule, ...rules];
    }

    return rules;
  }

  async create(userId: string, data: any): Promise<Rule> {
    const rule = await this.prisma.rule.create({
      data: {
        ...data,
        userId,
      },
    });
    await this.ordersService.recalculateUserOrders(userId);
    return rule;
  }

  async update(id: string, userId: string, data: any): Promise<Rule> {
    const rule = await this.prisma.rule.update({
      where: { id, userId },
      data,
    });
    await this.ordersService.recalculateUserOrders(userId);
    return rule;
  }

  async remove(id: string, userId: string): Promise<Rule> {
    const rule = await this.prisma.rule.delete({
      where: { id, userId },
    });
    await this.ordersService.recalculateUserOrders(userId);
    return rule;
  }
}
