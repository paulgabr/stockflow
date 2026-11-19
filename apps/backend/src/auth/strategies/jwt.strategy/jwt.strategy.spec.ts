import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../../../database/prisma.service';

import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const prismaMock = { user: { findUnique: jest.fn() } };
  const configMock = { getOrThrow: () => 'test-secret' };

  const strategy = new JwtStrategy(
    configMock as unknown as ConfigService,
    prismaMock as unknown as PrismaService,
  );

  const payload = {
    sub: 'user-1',
    email: 'old@example.com',
    companyId: 'company-1',
  };

  beforeEach(() => jest.clearAllMocks());

  it('returns the user from the database', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'new@example.com',
      companyId: 'company-1',
    });

    await expect(strategy.validate(payload)).resolves.toEqual({
      userId: 'user-1',
      email: 'new@example.com',
      companyId: 'company-1',
    });
  });

  it('rejects a token whose user no longer exists', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(strategy.validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
