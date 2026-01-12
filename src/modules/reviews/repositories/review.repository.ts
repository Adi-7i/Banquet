import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository } from '@infrastructure/database/repositories/base.repository';
import { Review, ReviewDocument, ModerationStatus } from '@infrastructure/database/schemas/review.schema';
import { RatingSummaryDto } from '../dto/review-response.dto';

/**
 * Review Repository
 * Data access layer for review operations
 */
@Injectable()
export class ReviewRepository extends BaseRepository<ReviewDocument> {
    constructor(@InjectModel(Review.name) reviewModel: Model<ReviewDocument>) {
        super(reviewModel);
    }

    /**
     * Check if customer has existing review for banquet
     */
    async hasExistingReview(customerId: string, banquetId: string): Promise<boolean> {
        const review = await this.model.findOne({
            customerId: new Types.ObjectId(customerId),
            banquetId: new Types.ObjectId(banquetId),
            deletedAt: null,
        }).exec();
        return review !== null;
    }

    /**
     * Get customer's review for banquet
     */
    async getCustomerReview(customerId: string, banquetId: string): Promise<ReviewDocument | null> {
        return this.model.findOne({
            customerId: new Types.ObjectId(customerId),
            banquetId: new Types.ObjectId(banquetId),
            deletedAt: null,
        }).exec();
    }

    /**
     * Get approved reviews for banquet with pagination
     */
    async getApprovedReviewsForBanquet(
        banquetId: string,
        page: number = 1,
        limit: number = 10,
        sortBy: 'recent' | 'rating_high' | 'rating_low' = 'recent',
    ): Promise<{ reviews: ReviewDocument[]; total: number }> {
        const filter = {
            banquetId: new Types.ObjectId(banquetId),
            moderationStatus: ModerationStatus.APPROVED,
            deletedAt: null,
        };

        const sortOptions: any = {
            recent: { createdAt: -1 },
            rating_high: { rating: -1, createdAt: -1 },
            rating_low: { rating: 1, createdAt: -1 },
        };

        const [reviews, total] = await Promise.all([
            this.model
                .find(filter)
                .sort(sortOptions[sortBy])
                .skip((page - 1) * limit)
                .limit(limit)
                .exec(),
            this.model.countDocuments(filter).exec(),
        ]);

        return { reviews, total };
    }

    /**
     * Get pending moderation reviews
     */
    async getPendingModerationReviews(
        page: number = 1,
        limit: number = 20,
    ): Promise<{ reviews: ReviewDocument[]; total: number }> {
        const filter = {
            moderationStatus: ModerationStatus.PENDING,
            deletedAt: null,
        };

        const [reviews, total] = await Promise.all([
            this.model
                .find(filter)
                .sort({ createdAt: 1 }) // Oldest first
                .skip((page - 1) * limit)
                .limit(limit)
                .exec(),
            this.model.countDocuments(filter).exec(),
        ]);

        return { reviews, total };
    }

    /**
     * Calculate rating summary for banquet
     */
    async calculateRatingSummary(banquetId: string): Promise<RatingSummaryDto> {
        const result = await this.model.aggregate([
            {
                $match: {
                    banquetId: new Types.ObjectId(banquetId),
                    moderationStatus: ModerationStatus.APPROVED,
                    deletedAt: null,
                },
            },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 },
                    rating1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
                    rating2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
                    rating3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
                    rating4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
                    rating5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
                },
            },
        ]).exec();

        if (result.length === 0) {
            return {
                averageRating: 0,
                totalReviews: 0,
                distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            };
        }

        const data = result[0];
        return {
            averageRating: Math.round((data.averageRating || 0) * 10) / 10,
            totalReviews: data.totalReviews,
            distribution: {
                1: data.rating1,
                2: data.rating2,
                3: data.rating3,
                4: data.rating4,
                5: data.rating5,
            },
        };
    }

    /**
     * Get customer's reviews
     */
    async getCustomerReviews(customerId: string): Promise<ReviewDocument[]> {
        return this.model.find({
            customerId: new Types.ObjectId(customerId),
            deletedAt: null,
        }).sort({ createdAt: -1 }).exec();
    }
}
