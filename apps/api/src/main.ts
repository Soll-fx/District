import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { join } from 'path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useBodyParser('json', { limit: '10mb' });
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app
    .getHttpAdapter()
    .get('/api/health', (_req: unknown, res: { json: (body: unknown) => void }) => {
      res.json({ status: 'ok', ts: Date.now() });
    });
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableCors({
    origin: config.get<string>('CORS_ORIGIN')?.split(',') ?? [
      'http://localhost:3000',
    ],
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Trading API')
    .setDescription('Пересборка приложения: сделки, идеи, аналитика, рейтинг')
    .setVersion('2.4.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = config.get<number>('PORT') ?? 4000;
  await app.listen(port);
  console.log(`API: http://localhost:${port}/api`);
  console.log(`Swagger: http://localhost:${port}/docs`);
}
void bootstrap();
