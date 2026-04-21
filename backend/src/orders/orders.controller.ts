import { Controller, Post, Get, UseInterceptors, UploadedFile, UseGuards, Request, BadRequestException, Param, Body, Query, Patch, Delete } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Post()
    async createOrder(@Request() req: any, @Body() body: any) {
        try {
            return await this.ordersService.createSingleOrder(req.user.id, body);
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadCsv(@Request() req: any, @UploadedFile() file: any) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }
        try {
            return await this.ordersService.processCsv(file.buffer, req.user.id);
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    @Post(':id/sync')
    async syncTracking(@Param('id') id: string, @Request() req: any) {
        return this.ordersService.syncTracking(id, req.user.id);
    }

    @Post(':id/notify')
    async notifyCustomer(@Param('id') id: string, @Request() req: any, @Body('message') message: string) {
        if (!message) {
            throw new BadRequestException('Message body is required');
        }
        return this.ordersService.notifyCustomer(id, req.user.id, message);
    }

    @Get('stats')
    async getStats(@Request() req: any) {
        return this.ordersService.getDashboardStats(req.user.id);
    }

    @Get()
    async getAllOrders(@Request() req: any, @Query('search') search?: string) {
        return this.ordersService.getAllOrders(req.user.id, search);
    }

    @Patch(':id')
    async updateOrder(@Param('id') id: string, @Request() req: any, @Body() body: any) {
        try {
            return await this.ordersService.updateOrder(id, req.user.id, body);
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }

    @Delete(':id')
    async deleteOrder(@Param('id') id: string, @Request() req: any) {
        try {
            return await this.ordersService.deleteOrder(id, req.user.id);
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }
}
