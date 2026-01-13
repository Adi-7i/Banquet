import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@config/config.module';
import { DatabaseModule } from '@infrastructure/database/database.module';
import { LoggerModule } from '@common/logger/logger.module';
import { AuditModule } from '@common/audit/audit.module';
import { HardeningModule } from '@common/hardening/hardening.module';
import { RequestIdMiddleware } from '@common/middleware/request-id.middleware';
import { RequestValidationMiddleware } from '@common/middleware/request-validation.middleware';
import { HealthModule } from '@modules/health/health.module';
import { AuthModule } from '@modules/auth/auth.module';
import { UsersModule } from '@modules/users/users.module';
import { OwnersModule } from '@modules/owners/owners.module';
import { BanquetsModule } from '@modules/banquets/banquets.module';
import { SearchModule } from '@modules/search/search.module';
import { BookingsModule } from '@modules/bookings/bookings.module';
import { ReviewsModule } from '@modules/reviews/reviews.module';
import { AdminModule } from '@modules/admin/admin.module';
import { AnalyticsModule } from '@modules/analytics/analytics.module';
import { RedisModule } from '@infrastructure/cache/redis.module';
// QueueModule removed - requires Redis. Uncomment when Redis is available:
// import { QueueModule } from '@infrastructure/queues/queue.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';

/**
 * Root Application Module
 * Imports all core modules and feature modules
 * Production hardened with security middleware and graceful shutdown
 */
@Module({
    imports: [
        // Global modules
        ConfigModule,
        DatabaseModule,
        LoggerModule,
        AuditModule,
        HardeningModule,
        RedisModule,
        // QueueModule, // Requires Redis - uncomment when Redis available

        // Security - Rate limiting
        ThrottlerModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                throttlers: [{
                    ttl: (config.get<number>('throttle.ttl') || 60) * 1000,
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
        AdminModule,
        AnalyticsModule,
    ],
})
export class AppModule implements NestModule {
    /**
     * Configure middleware for all routes
     */
    configure(consumer: MiddlewareConsumer): void {
        consumer
            .apply(RequestIdMiddleware, RequestValidationMiddleware)
            .forRoutes('*');
    }
}
