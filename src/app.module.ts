import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@config/config.module';
import { DatabaseModule } from '@infrastructure/database/database.module';
import { LoggerModule } from '@common/logger/logger.module';
import { AuditModule } from '@common/audit/audit.module';
import { RequestIdMiddleware } from '@common/middleware/request-id.middleware';
import { HealthModule } from '@modules/health/health.module';
import { AuthModule } from '@modules/auth/auth.module';
import { UsersModule } from '@modules/users/users.module';
import { OwnersModule } from '@modules/owners/owners.module';
import { BanquetsModule } from '@modules/banquets/banquets.module';
import { SearchModule } from '@modules/search/search.module';
import { BookingsModule } from '@modules/bookings/bookings.module';
import { ReviewsModule } from '@modules/reviews/reviews.module';
import { RedisModule } from '@infrastructure/cache/redis.module';
// QueueModule removed - requires Redis. Uncomment when Redis is available:
// import { QueueModule } from '@infrastructure/queues/queue.module';
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
        LoggerModule,
        AuditModule,
        RedisModule,
        // QueueModule, // Requires Redis - uncomment when Redis available

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
        SearchModule,
        BookingsModule,
        ReviewsModule,
    ],
})
export class AppModule implements NestModule {
    /**
     * Configure middleware for all routes
     */
    configure(consumer: MiddlewareConsumer): void {
        consumer
            .apply(RequestIdMiddleware)
            .forRoutes('*');
    }
}
