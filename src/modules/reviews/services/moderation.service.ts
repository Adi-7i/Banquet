import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ReviewRepository } from '../repositories/review.repository';
import { RatingService } from './rating.service';
import { ReviewResponseDto, ReviewsPaginatedDto } from '../dto/review-response.dto';
import { ModerationStatus, ReviewDocument } from '@infrastructure/database/schemas/review.schema';

/**
 * Moderation Service
 * Admin moderation for reviews
 */
@Injectable()
export class ModerationService {
    private readonly logger = new Logger(ModerationService.name);

    constructor(
        private readonly reviewRepository: ReviewRepository,
        private readonly ratingService: RatingService,
    ) { }

    /**
     * Approve review
     */
    async approveReview(reviewId: string, adminId: string): Promise<ReviewResponseDto> {
        const review = await this.reviewRepository.findById(reviewId);
        if (!review) {
            throw new NotFoundException('Review not found');
        }

        review.moderationStatus = ModerationStatus.APPROVED;
        review.moderatedBy = adminId;
        review.moderatedAt = new Date();
        review.addAuditEntry('REVIEW_APPROVED', adminId, 'Approved by moderator');
        await review.save();

        // Recalculate banquet rating
        await this.ratingService.recalculateBanquetRating(review.banquetId.toHexString());

        this.logger.log(`Review ${reviewId} approved by ${adminId}`);

        return this.mapToResponseDto(review);
    }

    /**
     * Reject review
     */
    async rejectReview(reviewId: string, adminId: string, reason: string): Promise<ReviewResponseDto> {
        const review = await this.reviewRepository.findById(reviewId);
        if (!review) {
            throw new NotFoundException('Review not found');
        }

        const wasApproved = review.moderationStatus === ModerationStatus.APPROVED;

        review.moderationStatus = ModerationStatus.REJECTED;
        review.moderationNote = reason;
        review.moderatedBy = adminId;
        review.moderatedAt = new Date();
        review.addAuditEntry('REVIEW_REJECTED', adminId, `Rejected: ${reason}`);
        await review.save();

        // Recalculate if was previously approved
        if (wasApproved) {
            await this.ratingService.recalculateBanquetRating(review.banquetId.toHexString());
        }

        this.logger.log(`Review ${reviewId} rejected by ${adminId}: ${reason}`);

        return this.mapToResponseDto(review);
    }

    /**
     * Get pending moderation queue
     */
    async getPendingReviews(page: number = 1, limit: number = 20): Promise<ReviewsPaginatedDto> {
        const { reviews, total } = await this.reviewRepository.getPendingModerationReviews(page, limit);

        return {
            data: reviews.map(r => this.mapToResponseDto(r)),
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1,
            },
        };
    }

    private mapToResponseDto(review: ReviewDocument): ReviewResponseDto {
        return {
            id: review._id.toHexString(),
            banquetId: review.banquetId.toHexString(),
            customerId: review.customerId.toHexString(),
            bookingId: review.bookingId.toHexString(),
            rating: review.rating,
            title: review.title,
            content: review.content,
            photos: review.photos,
            moderationStatus: review.moderationStatus,
            ownerReply: review.ownerReply,
            isEdited: review.isEdited,
            createdAt: review.createdAt,
            updatedAt: review.updatedAt,
        };
    }
}
