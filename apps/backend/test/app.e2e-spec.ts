import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from './../src/app.module';

describe('App (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /health reports the API and database as up', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok', database: 'up' });
  });

  it('POST /auth/login blocks an e-mail after 10 failed attempts', async () => {
    const email = `throttle-${Date.now()}@example.com`;
    const server = app.getHttpServer();

    for (let attempt = 0; attempt < 10; attempt++) {
      await request(server)
        .post('/auth/login')
        .send({ email, password: 'wrong-password' })
        .expect(401);
    }

    await request(server)
      .post('/auth/login')
      .send({ email: email.toUpperCase(), password: 'wrong-password' })
      .expect(429);
  });
});
