import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../database/prisma.service';
import { StockMovementType } from '../../generated/prisma/client';

import { StockMovementsService } from './stock-movements.service';

describe('StockMovementsService', () => {
  let service: StockMovementsService;

  const transactionMock = {
    product: {
      update: jest.fn(),
    },
    stockMovement: {
      create: jest.fn(),
    },
  };

  const prismaMock = {
    product: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(
      (callback: (transaction: typeof transactionMock) => Promise<unknown>) =>
        callback(transactionMock),
    ),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockMovementsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<StockMovementsService>(StockMovementsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw NotFoundException when product does not exist', async () => {
    prismaMock.product.findFirst.mockResolvedValue(null);

    await expect(
      service.create('company-1', {
        productId: 'product-1',
        type: StockMovementType.IN,
        quantity: 5,
      }),
    ).rejects.toThrow(NotFoundException);

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('should throw BadRequestException when OUT quantity is greater than stock', async () => {
    prismaMock.product.findFirst.mockResolvedValue({
      id: 'product-1',
      quantity: 10,
      companyId: 'company-1',
    });

    await expect(
      service.create('company-1', {
        productId: 'product-1',
        type: StockMovementType.OUT,
        quantity: 15,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('should increase product quantity when movement type is IN', async () => {
    const product = {
      id: 'product-1',
      quantity: 10,
      companyId: 'company-1',
    };

    const updatedProduct = {
      ...product,
      quantity: 15,
    };

    const movement = {
      id: 'movement-1',
      type: StockMovementType.IN,
      quantity: 5,
      productId: 'product-1',
      companyId: 'company-1',
    };

    prismaMock.product.findFirst.mockResolvedValue(product);
    transactionMock.product.update.mockResolvedValue(updatedProduct);
    transactionMock.stockMovement.create.mockResolvedValue(movement);

    const result = await service.create('company-1', {
      productId: 'product-1',
      type: StockMovementType.IN,
      quantity: 5,
    });

    expect(transactionMock.product.update).toHaveBeenCalledWith({
      where: {
        id: 'product-1',
      },
      data: {
        quantity: 15,
      },
    });

    expect(transactionMock.stockMovement.create).toHaveBeenCalledWith({
      data: {
        type: StockMovementType.IN,
        quantity: 5,
        productId: 'product-1',
        companyId: 'company-1',
      },
    });

    expect(result).toEqual({
      movement,
      product: updatedProduct,
    });
  });

  it('should decrease product quantity when movement type is OUT', async () => {
    const product = {
      id: 'product-1',
      quantity: 10,
      companyId: 'company-1',
    };

    const updatedProduct = {
      ...product,
      quantity: 7,
    };

    const movement = {
      id: 'movement-1',
      type: StockMovementType.OUT,
      quantity: 3,
      productId: 'product-1',
      companyId: 'company-1',
    };

    prismaMock.product.findFirst.mockResolvedValue(product);
    transactionMock.product.update.mockResolvedValue(updatedProduct);
    transactionMock.stockMovement.create.mockResolvedValue(movement);

    const result = await service.create('company-1', {
      productId: 'product-1',
      type: StockMovementType.OUT,
      quantity: 3,
    });

    expect(transactionMock.product.update).toHaveBeenCalledWith({
      where: {
        id: 'product-1',
      },
      data: {
        quantity: 7,
      },
    });

    expect(transactionMock.stockMovement.create).toHaveBeenCalledWith({
      data: {
        type: StockMovementType.OUT,
        quantity: 3,
        productId: 'product-1',
        companyId: 'company-1',
      },
    });

    expect(result).toEqual({
      movement,
      product: updatedProduct,
    });
  });
});
