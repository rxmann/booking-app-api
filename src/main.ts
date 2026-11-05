import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { applyResponseEnvelopes } from './modules/common/swagger/response-envelope.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder()
    .setTitle('Booking App API')
    .setDescription('Movie ticket booking REST API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = applyResponseEnvelopes(SwaggerModule.createDocument(app, config));
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
