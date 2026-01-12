import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ReviewRepository } from '../repositories/review.repository';
import { Banquet, BanquetDocument } from '@infrastructure/database/schemas/banquet.schema';
import { ModerationStatus } from '@infrastructure/database/schemas/review.schema';

/**
 * Rating Service
 * Handles automatic rating recalculation for banquets
 */
@Injectable()
export class RatingService {
    private readonly logger = new Logger(RatingService.name);

    constructor(
        private readonly reviewRepository: ReviewRepository,
        @InjectModel(Banquet.name) private banquetModel: Model<BanquetDocument>,
    ) { }

    /**
     * Recalculate and update banquet rating
     */
    async recalculateBanquetRating(banquetId: string): Promise<void> {
        try {
            const ratingSummary = await this.reviewRepository.calculateRatingSummary(banquetId);

            await this.banquetModel.findByIdAndUpdate(
                banquetId,
                {
                    $set: {
                        rating: ratingSummary.averageRating,
                        reviewCount: ratingSummary.totalReviews,
                        ratingDistribution: ratingSummary.distribution,
                        updatedAt: new Date(),
                    },
                },
            ).exec();

            this.logger.log(
                `Rating updated for banquet ${banquetId}: ${ratingSummary.averageRating} (${ratingSummary.totalReviews} reviews)`
            );
        } catch (error: any) {
            this.logger.error(`Failed to recalculate rating for ${banquetId}: ${error.message}`);
        }
    }

    /**
     * Get rating summary for banquet
     */
    async getRatingSummary(banquetId: string) {
        return this.reviewRepository.calculateRatingSummary(banquetId);
    }
}
