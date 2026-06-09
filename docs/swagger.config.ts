import { DocumentBuilder, SwaggerDocumentOptions } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('ScoutTalk API')
  .setDescription(
    'ScoutTalk - A Discord clone API with policy-based access control',
  )
  .setVersion('1.0')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Enter JWT token',
    },
    'JWT-auth',
  )
  .addTag('auth', 'Authentication endpoints')
  .addTag('users', 'User management endpoints')
  .addTag('servers', 'Server management endpoints')
  .addTag('channels', 'Channel and category management endpoints')
  .addTag('members', 'Server member and invite management endpoints')
  .addTag('health', 'Health check endpoints')
  .build();

export const swaggerOptions: SwaggerDocumentOptions = {
  operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
};
