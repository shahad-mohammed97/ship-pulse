import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { RulesService } from './rules.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('rules')
@UseGuards(JwtAuthGuard)
export class RulesController {
  constructor(private rulesService: RulesService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.rulesService.findAll(req.user.id);
  }

  @Post()
  create(@Request() req: any, @Body() data: any) {
    return this.rulesService.create(req.user.id, data);
  }

  @Put(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() data: any) {
    return this.rulesService.update(id, req.user.id, data);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.rulesService.remove(id, req.user.id);
  }
}
