import { ConflictException, Injectable } from '@nestjs/common';
import * as bycrypt from 'bcrypt';
import { PrismaService } from '../database/prisma.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(data: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bycrypt.hash(data.password, 10);

    const company = await this.prisma.company.create({
      data: {
        name: data.companyName,
        users: {
          create: {
            name: data.name,
            email: data.email,
            password: hashedPassword,
          },
        },
      },
      include: {
        users: true,
      },
    });

    const user = company.users[0];

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      companyId: company.id,
      companyName: company.name,
    };
  }
}
