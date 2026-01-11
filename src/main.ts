import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { LoggingInterceptor } from '@common/interceptors/logging.interceptor';
import helmet from 'helmet';

/**
 * Application Bootstrap
 * Entry point for the NestJS application
 */
async function bootstrap() {
    const logger = new Logger('Bootstrap');

    // Create NestJS application
    const app = await NestFactory.create(AppModule, {
        logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    // Get configuration service
    const configService = app.get(ConfigService);
    const port = configService.get<number>('app.port') || 3000;
    const env = configService.get<string>('app.env') || 'development';
    const appName = configService.get<string>('app.name') || 'CYNERZA Backend API';
    const corsOrigin = configService.get<string[]>('cors.origin') || [];
    const swaggerEnabled = configService.get<boolean>('swagger.enabled') || false;
    const swaggerPath = configService.get<string>('swagger.path') || 'api/docs';

    // Security - Helmet middleware for security headers
    app.use(helmet());

    // CORS configuration
    app.enableCors({
        origin: corsOrigin,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });

    // Global prefix for all routes
    app.setGlobalPrefix('api/v1');

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true, // Strip properties that don't have decorators
            forbidNonWhitelisted: true, // Throw error if non-whitelisted properties exist
            transform: true, // Automatically transform payloads to DTO instances
            transformOptions: {
                enableImplicitConversion: true, // Enable implicit type conversion
            },
        }),
    );

    // Global exception filter
    app.useGlobalFilters(new HttpExceptionFilter());

    // Global interceptors
    if (env === 'development') {
        app.useGlobalInterceptors(new LoggingInterceptor());
    }

    // Swagger API documentation
    if (swaggerEnabled) {
        const config = new DocumentBuilder()
            .setTitle(appName)
            .setDescription('CYNERZA Backend API - Banquet Management System')
            .setVersion('1.0')
            .addBearerAuth(
                {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
                'JWT-auth',
            )
            .addTag('Health', 'Health check endpoints')
            .addTag('Auth', 'Authentication and authorization')
            .addTag('Users', 'User management')
            .addTag('Owners', 'Owner profile management')
            .addTag('Customers', 'Customer profile management')
            .addTag('Banquets', 'Banquet management')
            .build();

        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup(swaggerPath, app, document, {
            swaggerOptions: {
                persistAuthorization: true,
            },
        });

        logger.log(`📚 Swagger documentation available at: /${swaggerPath}`);
    }

    // Graceful shutdown
    app.enableShutdownHooks();

    // Start the application
    await app.listen(port);

    logger.log(`🚀 ${appName} is running in ${env} mode`);
    logger.log(`🌐 Server listening on: http://localhost:${port}/api/v1`);
    logger.log(`✅ Application started successfully`);
}

// Start the application
bootstrap().catch((error) => {
    const logger = new Logger('Bootstrap');
    logger.error('❌ Failed to start application', error);
    process.exit(1);
});
