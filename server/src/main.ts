import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.setGlobalPrefix('api');

  // Swagger配置
  const config = new DocumentBuilder()
    .setTitle('TurboMe API')
    .setDescription('Full-stack TypeScript application API documentation')
    .setVersion('1.0')
    .addTag('General', 'General application endpoints')
    .addTag('Users', 'User management endpoints')
    .addTag('Files', 'File management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // 设置Swagger UI
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'TurboMe API Documentation',
    customfavIcon: '/favicon.ico',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  // 添加JSON端点供前端使用
  app.getHttpAdapter().get('/api/docs-json', (req, res) => {
    res.json(document);
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`API Documentation: http://localhost:${port}/api/docs`);
  console.log(`API JSON: http://localhost:${port}/api/docs-json`);
}
bootstrap();