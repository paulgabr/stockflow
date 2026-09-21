import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';

import { ProductsService } from './products.service';
import { PrismaService } from '../database/prisma.service';

describe('ProductsService', () => {
  let service: ProductsService;

  const prismaMock = {
    product: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return products from the company', async () => {
      const products = [
        {
          id: 'product-1',
          name: 'Notebook',
          companyId: 'company-1',
        },
      ];

      prismaMock.product.findMany.mockResolvedValue(products);

      const result = await service.findAll('company-1');

      expect(result).toEqual(products);

      expect(prismaMock.product.findMany).toHaveBeenCalledWith({
        where: {
          companyId: 'company-1',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return a product from the company', async () => {
      const product = {
        id: 'product-1',
        name: 'Notebook',
        companyId: 'company-1',
      };

      prismaMock.product.findFirst.mockResolvedValue(product);

      const result = await service.findOne('company-1', 'product-1');

      expect(result).toEqual(product);

      expect(prismaMock.product.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'product-1',
          companyId: 'company-1',
        },
      });
    });

    it('should throw NotFoundException when product does not exist', async () => {
      prismaMock.product.findFirst.mockResolvedValue(null);

      await expect(service.findOne('company-1', 'product-999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create a product for the company', async () => {
      const productData = {
        name: 'Notebook Dell',
        sku: 'NOTE-001',
        description: 'Notebook para escritório',
        price: 3499.9,
        quantity: 10,
      };

      const createdProduct = {
        id: 'product-1',
        ...productData,
        companyId: 'company-1',
      };

      prismaMock.product.create.mockResolvedValue(createdProduct);

      const result = await service.create('company-1', productData);

      expect(result).toEqual(createdProduct);

      expect(prismaMock.product.create).toHaveBeenCalledWith({
        data: {
          ...productData,
          companyId: 'company-1',
        },
      });
    });

    it('should throw ConflictException when SKU already exists', async () => {
      const productData = {
        name: 'Notebook Dell',
        sku: 'NOTE-001',
        description: 'Notebook para escritório',
        price: 3499.9,
        quantity: 10,
      };

      prismaMock.product.create.mockRejectedValue({
        code: 'P2002',
      });

      await expect(service.create('company-1', productData)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('should update a product for the company', async () => {
      const existingProduct = {
        id: 'product-1',
        name: 'Notebook Dell',
        sku: 'NOTE-001',
        description: 'Notebook para escritório',
        price: 3499.9,
        quantity: 10,
        companyId: 'company-1',
      };

      const updatedData = {
        name: 'Notebook Dell Updated',
        price: 3599.9,
      };

      const updatedProduct = {
        ...existingProduct,
        ...updatedData,
      };

      prismaMock.product.findFirst.mockResolvedValue(existingProduct);
      prismaMock.product.update.mockResolvedValue(updatedProduct);

      const result = await service.update(
        'company-1',
        'product-1',
        updatedData,
      );

      expect(result).toEqual(updatedProduct);

      expect(prismaMock.product.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'product-1',
          companyId: 'company-1',
        },
      });

      expect(prismaMock.product.update).toHaveBeenCalledWith({
        where: {
          id: 'product-1',
        },
        data: updatedData,
      });
    });

    it('should throw NotFoundException when product does not exist', async () => {
      prismaMock.product.findFirst.mockResolvedValue(null);

      await expect(
        service.update('company-1', 'product-999', { name: 'Updated Name' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when SKU already exists during update', async () => {
      const existingProduct = {
        id: 'product-1',
        name: 'Notebook Dell',
        sku: 'NOTE-001',
        description: 'Notebook para escritório',
        price: 3499.9,
        quantity: 10,
        companyId: 'company-1',
      };

      prismaMock.product.findFirst.mockResolvedValue(existingProduct);
      prismaMock.product.update.mockRejectedValue({
        code: 'P2002',
      });

      await expect(
        service.update('company-1', 'product-1', { sku: 'NOTE-001' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should delete a product from the company', async () => {
      const existingProduct = {
        id: 'product-1',
        name: 'Notebook',
        companyId: 'company-1',
      };

      prismaMock.product.findFirst.mockResolvedValue(existingProduct);
      prismaMock.product.delete.mockResolvedValue(existingProduct);

      const result = await service.delete('company-1', 'product-1');

      expect(result).toEqual({
        message: 'Product deleted successfully',
      });

      expect(prismaMock.product.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'product-1',
          companyId: 'company-1',
        },
      });

      expect(prismaMock.product.delete).toHaveBeenCalledWith({
        where: {
          id: 'product-1',
        },
      });
    });

    it('should throw NotFoundException when deleting a nonexistent product', async () => {
      prismaMock.product.findFirst.mockResolvedValue(null);

      await expect(service.delete('company-1', 'product-999')).rejects.toThrow(
        NotFoundException,
      );

      expect(prismaMock.product.delete).not.toHaveBeenCalled();
    });
  });
});
