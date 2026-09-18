import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

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

  async findAll(companyId: string) {
    return this.prisma.product.findMany({
      where: {
        companyId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(companyId: string, id: string) {
    return this.prisma.product.findFirst({
      where: {
        companyId,
        id,
      },
    });
  }

  async update(companyId: string, id: string, data: UpdateProductDto) {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.product.update({
      where: {
        id: product.id,
      },
      data,
    });
  }
}
