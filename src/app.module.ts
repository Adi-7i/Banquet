import { Module } from '@nestjs/common';
import { ConfigModule } from '@config/config.module';
import { DatabaseModule } from '@infrastructure/database/database.module';
import { HealthModule } from '@modules/health/health.module';
import { AuthModule } from '@modules/auth/auth.module';
import { UsersModule } from '@modules/users/users.module';
import { OwnersModule } from '@modules/owners/owners.module';
import { BanquetsModule } from '@modules/banquets/banquets.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';

/**
 * Root Application Module
 * Imports all core modules and feature modules
 */
@Module({
    imports: [
        // Global modules
        ConfigModule,
        DatabaseModule,

        // Security - Rate limiting
        ThrottlerModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                throttlers: [{
                    ttl: (config.get<number>('throttle.ttl') || 60) * 1000, // Convert to ms
                    limit: config.get<number>('throttle.limit') || 100,
                }],
            }),
        }),

        // Feature modules
        AuthModule,
        HealthModule,
        UsersModule,
        OwnersModule,
        BanquetsModule,
    ],
})
export class AppModule { }

