import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BookingsController } from './bookings.controller';
import { BookingService } from './services/booking.service';
import { PricingService } from './services/pricing.service';
import { BookingRepository } from './repositories/booking.repository';
import { AvailabilityRepository } from './repositories/availability.repository';
import { Booking, BookingSchema } from '@infrastructure/database/schemas/booking.schema';
import { Availability, AvailabilitySchema } from '@infrastructure/database/schemas/availability.schema';
import { PricingConfig, PricingConfigSchema } from '@infrastructure/database/schemas/pricing-config.schema';
import { Banquet, BanquetSchema } from '@infrastructure/database/schemas/banquet.schema';
import { DistributedLockService } from '@infrastructure/cache/distributed-lock.service';
import { RedisModule } from '@infrastructure/cache/redis.module';
import { AuthModule } from '@modules/auth/auth.module';
// BullMQ removed - requires Redis. Uncomment when Redis available:
// import { BullModule } from '@nestjs/bullmq';
// import { BookingConfirmationProcessor } from '@infrastructure/queues/processors/booking-confirmation.processor';

/**
 * Bookings Module
 * Complete booking and availability management system
 */
@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Booking.name, schema: BookingSchema },
            { name: Availability.name, schema: AvailabilitySchema },
            { name: PricingConfig.name, schema: PricingConfigSchema },
            { name: Banquet.name, schema: BanquetSchema },
        ]),
        // BullModule.registerQueue({ name: 'booking-confirmation' }), // Requires Redis
        RedisModule,
        AuthModule,
    ],
    controllers: [BookingsController],
    providers: [
        BookingService,
        PricingService,
        BookingRepository,
        AvailabilityRepository,
        DistributedLockService,
        // BookingConfirmationProcessor, // Requires Redis
    ],
    exports: [BookingService, AvailabilityRepository, PricingService],
})
export class BookingsModule { }

