import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import configuration from './configuration';
import { envValidationSchema } from './env.validation';

/**
 * Global configuration module
 * Validates and loads environment variables at application startup
 */
@Module({
    imports: [
        NestConfigModule.forRoot({
            isGlobal: true,
            load: [configuration],
            validationSchema: envValidationSchema,
            validationOptions: {
                allowUnknown: true,
                abortEarly: false,
            },
            envFilePath: [
                `.env.${process.env.NODE_ENV || 'development'}`,
                '.env',
            ],
        }),
    ],
})
export class ConfigModule { }
