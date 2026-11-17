import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';

import { CreateStockAdjustmentDto } from './dto/create-stock-adjustment.dto';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { FindStockMovementsQueryDto } from './dto/find-stock-movements-query.dto';

import { StockMovementType } from '../../generated/prisma/client';

export const STOCK_CHANGED_MESSAGE =
  'Stock quantity changed during the adjustment, please try again';

@Injectable()
export class StockMovementsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, data: CreateStockMovementDto) {
    return this.prisma.$transaction(async (transaction) => {
      const product = await transaction.product.findFirst({
        where: {
          id: data.productId,
          companyId,
          archivedAt: null,
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
          note: data.note?.trim() || null,
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

  // Sets the stock to the correct balance (e.g. after an inventory count or to
  // fix a typo) and records the difference as an ADJUSTMENT movement.
  async adjust(companyId: string, data: CreateStockAdjustmentDto) {
    return this.prisma.$transaction(async (transaction) => {
      const product = await transaction.product.findFirst({
        where: {
          id: data.productId,
          companyId,
          archivedAt: null,
        },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      if (data.quantity === product.quantity) {
        throw new BadRequestException(
          'New quantity is equal to the current stock',
        );
      }

      // Only applies if the stock is still the value we just read, so a
      // concurrent movement is never silently overwritten.
      const { count } = await transaction.product.updateMany({
        where: {
          id: product.id,
          quantity: product.quantity,
        },
        data: {
          quantity: data.quantity,
        },
      });

      if (count === 0) {
        throw new ConflictException(STOCK_CHANGED_MESSAGE);
      }

      const movement = await transaction.stockMovement.create({
        data: {
          type: StockMovementType.ADJUSTMENT,
          reason: data.reason,
          note: data.note?.trim() || null,
          quantity: Math.abs(data.quantity - product.quantity),
          previousQuantity: product.quantity,
          newQuantity: data.quantity,
          productId: product.id,
          companyId,
        },
      });

      return {
        movement,
        product: { ...product, quantity: data.quantity },
      };
    });
  }

  async findAll(companyId: string, query: FindStockMovementsQueryDto) {
    const { type, productId, page = 1, limit = 10 } = query;

    const where = {
      companyId,
      ...(type && { type }),
      ...(productId && { productId }),
    };

    const [data, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        // id breaks ties between movements created in the same instant, so
        // pages never overlap.
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
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
