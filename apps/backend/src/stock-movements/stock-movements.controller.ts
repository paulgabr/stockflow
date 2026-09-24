import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { StockMovementsService } from './stock-movements.service';

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
}
