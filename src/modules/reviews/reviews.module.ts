import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReviewsController } from './reviews.controller';
import { ReviewService } from './services/review.service';
import { RatingService } from './services/rating.service';
import { ModerationService } from './services/moderation.service';
import { ReviewRepository } from './repositories/review.repository';
import { Review, ReviewSchema } from '@infrastructure/database/schemas/review.schema';
import { Booking, BookingSchema } from '@infrastructure/database/schemas/booking.schema';
import { Banquet, BanquetSchema } from '@infrastructure/database/schemas/banquet.schema';
import { AuthModule } from '@modules/auth/auth.module';

/**
 * Reviews Module
 * Complete review and rating management system
 */
@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Review.name, schema: ReviewSchema },
            { name: Booking.name, schema: BookingSchema },
            { name: Banquet.name, schema: BanquetSchema },
        ]),
        AuthModule,
    ],
    controllers: [ReviewsController],
    providers: [
        ReviewService,
        RatingService,
        ModerationService,
        ReviewRepository,
    ],
    exports: [ReviewService, RatingService],
})
export class ReviewsModule { }
