import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL is not defined');
    }

    const adapter = new PrismaPg({
      connectionString: connectionString,
    });

    super({ adapter });
  }

  // Closes the connection pool on shutdown (SIGTERM from Docker, app.close()
  // in tests) so the process can exit cleanly.
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
