import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import helmet from 'helmet';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { LoggingInterceptor } from './common/interceptors/logging.interceptors';

import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.simple()
          ),
        }),
      ],
    }),
  });

  app.use(helmet());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('API Documentation')           
    .setDescription('Descripción de la API') 
    .setVersion('1.0')                   

    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document);

  await app.listen(3000);
}

bootstrap();
