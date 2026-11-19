import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

import { AppModule } from './app.module';

// Number of proxies in front of the API (e.g. the Next.js server, which
// forwards the user's IP). Only set it when the API is not reachable directly,
// otherwise clients could spoof X-Forwarded-For to dodge rate limits.
function parseTrustProxy(value: string | undefined) {
  const hops = Number(value);

  return Number.isInteger(hops) && hops > 0 ? hops : false;
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const isProduction = process.env.NODE_ENV === 'production';

  app.set('trust proxy', parseTrustProxy(process.env.TRUST_PROXY));
  app.use(helmet());
  app.enableShutdownHooks();

  // The frontend calls the API from its server, so browsers only need CORS
  // when an origin is explicitly allowed.
  app.enableCors({
    origin: process.env.FRONTEND_URL?.split(',').filter(Boolean) ?? false,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  if (!isProduction || process.env.SWAGGER_ENABLED === 'true') {
    const config = new DocumentBuilder()
      .setTitle('StockFlow API')
      .setDescription('Inventory Management SaaS')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token',
        },
        'access-token',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup('docs', app, document);
  }

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
