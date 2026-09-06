import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Necesario para que el frontend Angular (servido en otro origen, p. ej.
  // http://localhost:4200) pueda consumir esta API desde el navegador.
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Code Insight AI')
    .setDescription(
      'API para ingeniería inversa automatizada de repositorios de código: recibe una URL pública de GitHub o un archivo ZIP y devuelve tecnologías, componentes, arquitectura, APIs, hallazgos, riesgos y recomendaciones detectados a partir de evidencia real del código.',
    )
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();