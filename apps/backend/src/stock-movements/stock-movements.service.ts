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
    return this.prisma.$transaction(async (transaction) => {
      const product = await transaction.product.findFirst({
        where: {
          id: data.productId,
          companyId,
        },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      // Stock check and update happen in a single atomic UPDATE, so
      // concurrent OUT movements can never push the quantity below zero.
      const { count } = await transaction.product.updateMany({
        where: {
          id: product.id,
          ...(data.type === StockMovementType.OUT && {
            quantity: { gte: data.quantity },
          }),
        },
        data: {
          quantity:
            data.type === StockMovementType.IN
              ? { increment: data.quantity }
              : { decrement: data.quantity },
        },
      });

      if (count === 0) {
        throw new BadRequestException('Insufficient stock');
      }

      const updatedProduct = await transaction.product.findUniqueOrThrow({
        where: {
          id: product.id,
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
