import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductsService } from './products.service';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    email: string;
    companyId: string;
  };
}

@Controller('products')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Req() request: AuthenticatedRequest, @Body() data: CreateProductDto) {
    return this.productsService.create(request.user.companyId, data);
  }
}
