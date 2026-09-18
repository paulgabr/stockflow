import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductsService } from './products.service';
import { UpdateProductDto } from './dto/update-product.dto';

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

  @Get()
  findAll(@Req() request: AuthenticatedRequest) {
    return this.productsService.findAll(request.user.companyId);
  }

  @Get(':id')
  findOne(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.productsService.findOne(request.user.companyId, id);
  }

  @Patch(':id')
  update(
    @Req() request: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() data: UpdateProductDto,
  ) {
    return this.productsService.update(request.user.companyId, id, data);
  }

  @Delete(':id')
  remove(@Req() request: AuthenticatedRequest, @Param('id') id: string) {
    return this.productsService.delete(request.user.companyId, id);
  }
}
