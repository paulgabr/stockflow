import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../database/prisma.service';
import { StockMovementType } from '../../generated/prisma/client';

import { StockMovementsService } from './stock-movements.service';

describe('StockMovementsService', () => {
  let service: StockMovementsService;

  const transactionMock = {
    product: {
      findFirst: jest.fn(),
      updateMany: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
    stockMovement: {
      create: jest.fn(),
    },
  };

  const prismaMock = {
    stockMovement: {
      findMany: jest.fn(),
      count: jest.fn(),
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
    transactionMock.product.findFirst.mockResolvedValue(null);

    await expect(
      service.create('company-1', {
        productId: 'product-1',
        type: StockMovementType.IN,
        quantity: 5,
      }),
    ).rejects.toThrow(NotFoundException);

    expect(transactionMock.product.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'product-1',
        companyId: 'company-1',
      },
    });
    expect(transactionMock.product.updateMany).not.toHaveBeenCalled();
    expect(transactionMock.stockMovement.create).not.toHaveBeenCalled();
  });

  it('should throw BadRequestException when OUT quantity is greater than stock', async () => {
    transactionMock.product.findFirst.mockResolvedValue({
      id: 'product-1',
      quantity: 10,
      companyId: 'company-1',
    });
    transactionMock.product.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.create('company-1', {
        productId: 'product-1',
        type: StockMovementType.OUT,
        quantity: 15,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(transactionMock.product.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'product-1',
        quantity: { gte: 15 },
      },
      data: {
        quantity: { decrement: 15 },
      },
    });
    expect(transactionMock.stockMovement.create).not.toHaveBeenCalled();
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

    transactionMock.product.findFirst.mockResolvedValue(product);
    transactionMock.product.updateMany.mockResolvedValue({ count: 1 });
    transactionMock.product.findUniqueOrThrow.mockResolvedValue(updatedProduct);
    transactionMock.stockMovement.create.mockResolvedValue(movement);

    const result = await service.create('company-1', {
      productId: 'product-1',
      type: StockMovementType.IN,
      quantity: 5,
    });

    expect(transactionMock.product.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'product-1',
      },
      data: {
        quantity: { increment: 5 },
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

    transactionMock.product.findFirst.mockResolvedValue(product);
    transactionMock.product.updateMany.mockResolvedValue({ count: 1 });
    transactionMock.product.findUniqueOrThrow.mockResolvedValue(updatedProduct);
    transactionMock.stockMovement.create.mockResolvedValue(movement);

    const result = await service.create('company-1', {
      productId: 'product-1',
      type: StockMovementType.OUT,
      quantity: 3,
    });

    expect(transactionMock.product.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'product-1',
        quantity: { gte: 3 },
      },
      data: {
        quantity: { decrement: 3 },
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

  it('should return paginated stock movements for the company', async () => {
    const movements = [
      {
        id: 'movement-1',
        type: StockMovementType.IN,
        quantity: 10,
        createdAt: new Date(),
        productId: 'product-1',
        companyId: 'company-1',
        product: {
          id: 'product-1',
          name: 'Notebook Dell',
          sku: 'NOTE-001',
        },
      },
      {
        id: 'movement-2',
        type: StockMovementType.OUT,
        quantity: 3,
        createdAt: new Date(),
        productId: 'product-2',
        companyId: 'company-1',
        product: {
          id: 'product-2',
          name: 'Mouse Logitech',
          sku: 'MOUSE-001',
        },
      },
    ];

    prismaMock.stockMovement.findMany.mockResolvedValue(movements);
    prismaMock.stockMovement.count.mockResolvedValue(2);

    const result = await service.findAll('company-1', {});

    expect(prismaMock.stockMovement.findMany).toHaveBeenCalledWith({
      where: {
        companyId: 'company-1',
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        product: true,
      },
      skip: 0,
      take: 10,
    });

    expect(prismaMock.stockMovement.count).toHaveBeenCalledWith({
      where: {
        companyId: 'company-1',
      },
    });

    expect(result).toEqual({
      data: movements,
      meta: {
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      },
    });
  });

  it('should combine type filter with pagination', async () => {
    const movements = [
      {
        id: 'movement-11',
        type: StockMovementType.OUT,
        quantity: 2,
        createdAt: new Date(),
        productId: 'product-1',
        companyId: 'company-1',
      },
    ];

    prismaMock.stockMovement.findMany.mockResolvedValue(movements);
    prismaMock.stockMovement.count.mockResolvedValue(11);

    const result = await service.findAll('company-1', {
      type: StockMovementType.OUT,
      page: 2,
      limit: 10,
    });

    expect(prismaMock.stockMovement.findMany).toHaveBeenCalledWith({
      where: {
        companyId: 'company-1',
        type: StockMovementType.OUT,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        product: true,
      },
      skip: 10,
      take: 10,
    });

    expect(prismaMock.stockMovement.count).toHaveBeenCalledWith({
      where: {
        companyId: 'company-1',
        type: StockMovementType.OUT,
      },
    });

    expect(result).toEqual({
      data: movements,
      meta: {
        page: 2,
        limit: 10,
        total: 11,
        totalPages: 2,
      },
    });
  });
});
