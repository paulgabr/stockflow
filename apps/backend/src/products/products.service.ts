import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, data: CreateProductDto) {
    try {
      return await this.prisma.product.create({
        data: {
          name: data.name,
          sku: data.sku,
          description: data.description,
          price: data.price,
          quantity: data.quantity,
          companyId,
        },
      });
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Product with the same SKU already exists');
      }
      throw error;
    }
  }

  async findAll(companyId: string) {
    return this.prisma.product.findMany({
      where: {
        companyId,
        archivedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(companyId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        companyId,
        id,
        archivedAt: null,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(companyId: string, id: string, data: UpdateProductDto) {
    try {
      const product = await this.prisma.product.findFirst({
        where: {
          id,
          companyId,
          archivedAt: null,
        },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      return await this.prisma.product.update({
        where: {
          id: product.id,
        },
        data,
      });
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Product with the same SKU already exists');
      }
      throw error;
    }
  }

  // Products are archived instead of deleted so their stock movement
  // history is preserved.
  async delete(companyId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        companyId,
        archivedAt: null,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.prisma.product.update({
      where: {
        id: product.id,
      },
      data: {
        archivedAt: new Date(),
      },
    });

    return { message: 'Product archived successfully' };
  }
}
