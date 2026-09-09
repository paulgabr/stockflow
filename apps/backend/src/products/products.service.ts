import { Injectable } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, data: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        name: data.name,
        sku: data.sku,
        description: data.description,
        price: data.price,
        quantity: data.quantity,
        companyId,
      },
    });
  }
}
