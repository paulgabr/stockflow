import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';

import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { FindStockMovementsQueryDto } from './dto/find-stock-movements-query.dto';

import { StockMovementType } from '../../generated/prisma/client';

@Injectable()
export class StockMovementsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, data: CreateStockMovementDto) {
    const product = await this.prisma.product.findFirst({
      where: {
        id: data.productId,
        companyId,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (
      data.type === StockMovementType.OUT &&
      product.quantity < data.quantity
    ) {
      throw new BadRequestException('Insufficient stock');
    }

    const newQuantity =
      data.type === StockMovementType.IN
        ? product.quantity + data.quantity
        : product.quantity - data.quantity;

    return this.prisma.$transaction(async (transaction) => {
      const updatedProduct = await transaction.product.update({
        where: {
          id: product.id,
        },
        data: {
          quantity: newQuantity,
        },
      });

      const movement = await transaction.stockMovement.create({
        data: {
          type: data.type,
          quantity: data.quantity,
          productId: product.id,
          companyId,
        },
      });

      return {
        movement,
        product: updatedProduct,
      };
    });
  }

  async findAll(companyId: string, query: FindStockMovementsQueryDto) {
    const { type, page = 1, limit = 10 } = query;

    const where = {
      companyId,
      ...(type && { type }),
    };

    const [data, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          product: true,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.stockMovement.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
