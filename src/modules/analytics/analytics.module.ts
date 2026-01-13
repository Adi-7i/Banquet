import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsController } from './analytics.controller';
import { EventTrackerService } from './services/event-tracker.service';
import { MetricsService } from './services/metrics.service';
import { ObservabilityService } from './services/observability.service';
import { PerformanceMiddleware } from '@common/middleware/performance.middleware';
import { AnalyticsEvent, AnalyticsEventSchema } from '@infrastructure/database/schemas/analytics-event.schema';
import { MetricsSnapshot, MetricsSnapshotSchema } from '@infrastructure/database/schemas/metrics-snapshot.schema';
import { PerformanceLog, PerformanceLogSchema } from '@infrastructure/database/schemas/performance-log.schema';
import { User, UserSchema } from '@infrastructure/database/schemas/user.schema';
import { Booking, BookingSchema } from '@infrastructure/database/schemas/booking.schema';
import { AuthModule } from '@modules/auth/auth.module';

/**
 * Analytics Module
 * Comprehensive analytics and observability
 */
@Module({
    imports: [
        MongooseModule.forFeature([
            { name: AnalyticsEvent.name, schema: AnalyticsEventSchema },
            { name: MetricsSnapshot.name, schema: MetricsSnapshotSchema },
            { name: PerformanceLog.name, schema: PerformanceLogSchema },
            { name: User.name, schema: UserSchema },
            { name: Booking.name, schema: BookingSchema },
        ]),
        AuthModule,
    ],
    controllers: [AnalyticsController],
    providers: [
        EventTrackerService,
        MetricsService,
        ObservabilityService,
    ],
    exports: [EventTrackerService, ObservabilityService],
})
export class AnalyticsModule implements NestModule {
    configure(consumer: MiddlewareConsumer): void {
        // Apply performance middleware to all routes
        consumer
            .apply(PerformanceMiddleware)
            .forRoutes('*');
    }
}
