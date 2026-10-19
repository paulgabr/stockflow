import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { FindStockMovementsQueryDto } from './dto/find-stock-movements-query.dto';
import { StockMovementsService } from './stock-movements.service';
import { StockMovementType } from 'generated/prisma/client';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    companyId: string;
  };
}

@Controller('stock-movements')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
export class StockMovementsController {
  constructor(private readonly stockMovementsService: StockMovementsService) {}

  @Post()
  create(
    @Req() request: AuthenticatedRequest,
    @Body() data: CreateStockMovementDto,
  ) {
    return this.stockMovementsService.create(request.user.companyId, data);
  }

  @ApiQuery({
    name: 'type',
    required: false,
    enum: StockMovementType,
    description: 'Filter movements by type (IN or OUT)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10, max: 100)',
  })
  @Get()
  findAll(
    @Req() request: AuthenticatedRequest,
    @Query() query: FindStockMovementsQueryDto,
  ) {
    return this.stockMovementsService.findAll(request.user.companyId, query);
  }
}
