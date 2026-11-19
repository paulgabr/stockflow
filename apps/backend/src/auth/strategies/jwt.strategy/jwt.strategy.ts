import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { PrismaService } from '../../../database/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  companyId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  // A valid signature is not enough: the user may have been removed since the
  // token was issued. The database is the source of truth for the company.
  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, companyId: true },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      userId: user.id,
      email: user.email,
      companyId: user.companyId,
    };
  }
}
