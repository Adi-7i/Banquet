import { Module } from '@nestjs/common';
import { ConfigModule } from '@config/config.module';
import { DatabaseModule } from '@infrastructure/database/database.module';
import { HealthModule } from '@modules/health/health.module';

/**
 * Root Application Module
 * Imports all core modules and feature modules
 */
@Module({
    imports: [
        // Global modules
        ConfigModule,
        DatabaseModule,

        // Feature modules
        HealthModule,
    ],
})
export class AppModule { }
