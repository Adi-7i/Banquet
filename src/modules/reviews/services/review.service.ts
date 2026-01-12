import { Injectable, Logger, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ReviewRepository } from '../repositories/review.repository';
import { RatingService } from './rating.service';
import { CreateReviewDto, UpdateReviewDto, OwnerReplyDto } from '../dto/review.dto';
import { ReviewResponseDto, ReviewsPaginatedDto } from '../dto/review-response.dto';
import { ModerationStatus, ReviewDocument } from '@infrastructure/database/schemas/review.schema';
import { Booking, BookingDocument, BookingStatus } from '@infrastructure/database/schemas/booking.schema';
import { Banquet, BanquetDocument } from '@infrastructure/database/schemas/banquet.schema';

/**
 * Review Service
 * Core business logic for review management
 */
@Injectable()
export class ReviewService {
    private readonly logger = new Logger(ReviewService.name);
    private readonly REVIEW_WINDOW_DAYS = 30; // Days after booking to allow review

    constructor(
        private readonly reviewRepository: ReviewRepository,
        private readonly ratingService: RatingService,
        @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
        @InjectModel(Banquet.name) private banquetModel: Model<BanquetDocument>,
    ) { }

    /**
     * Create a new review (verified booking required)
     */
    async createReview(customerId: string, dto: CreateReviewDto): Promise<ReviewResponseDto> {
        const { banquetId, rating, title, content, photos } = dto;

        // Check if customer has completed booking for this banquet
        const completedBooking = await this.findCompletedBooking(customerId, banquetId);
        if (!completedBooking) {
            throw new ForbiddenException('You must have a completed booking to leave a review');
        }

        // Check if within review window
        const daysSinceBooking = this.getDaysSince(completedBooking.eventDate);
        if (daysSinceBooking > this.REVIEW_WINDOW_DAYS) {
            throw new BadRequestException(`Review window expired. Reviews must be submitted within ${this.REVIEW_WINDOW_DAYS} days of event.`);
        }

        // Check for existing review
        const hasExisting = await this.reviewRepository.hasExistingReview(customerId, banquetId);
        if (hasExisting) {
            throw new ConflictException('You have already reviewed this banquet');
        }

        // Check spam indicators
        const spamScore = this.calculateSpamScore(content);

        // Create review
        const review = await this.reviewRepository.create({
            banquetId: new Types.ObjectId(banquetId),
            customerId: new Types.ObjectId(customerId),
            bookingId: completedBooking._id,
            rating,
            title,
            content,
            photos: photos || [],
            moderationStatus: ModerationStatus.PENDING,
            spamScore,
            createdBy: customerId,
        } as any);

        review.addAuditEntry('REVIEW_CREATED', customerId, 'Initial review submission');
        await review.save();

        this.logger.log(`Review created by ${customerId} for banquet ${banquetId}`);

        return this.mapToResponseDto(review);
    }

    /**
     * Update own review
     */
    async updateReview(reviewId: string, customerId: string, dto: UpdateReviewDto): Promise<ReviewResponseDto> {
        const review = await this.reviewRepository.findById(reviewId);
        if (!review) {
            throw new NotFoundException('Review not found');
        }

        // Verify ownership
        if (review.customerId.toHexString() !== customerId) {
            throw new ForbiddenException('You can only edit your own reviews');
        }

        // Cannot edit rejected reviews
        if (review.moderationStatus === ModerationStatus.REJECTED) {
            throw new BadRequestException('Cannot edit a rejected review');
        }

        // Save edit history
        review.editHistory.push({
            previousContent: review.content,
            previousRating: review.rating,
            editedAt: new Date(),
        });

        // Update fields
        if (dto.rating !== undefined) review.rating = dto.rating;
        if (dto.title !== undefined) review.title = dto.title;
        if (dto.content !== undefined) review.content = dto.content;
        if (dto.photos !== undefined) review.photos = dto.photos as any;

        review.isEdited = true;
        review.moderationStatus = ModerationStatus.PENDING; // Re-moderate
        review.updatedBy = customerId;
        review.addAuditEntry('REVIEW_UPDATED', customerId, 'Review edited by customer');
        await review.save();

        this.logger.log(`Review ${reviewId} updated by ${customerId}`);

        return this.mapToResponseDto(review);
    }

    /**
     * Delete own review
     */
    async deleteReview(reviewId: string, userId: string, isAdmin: boolean = false): Promise<void> {
        const review = await this.reviewRepository.findById(reviewId);
        if (!review) {
            throw new NotFoundException('Review not found');
        }

        // Verify ownership or admin
        if (!isAdmin && review.customerId.toHexString() !== userId) {
            throw new ForbiddenException('You can only delete your own reviews');
        }

        const banquetId = review.banquetId.toHexString();

        review.deletedAt = new Date();
        review.addAuditEntry('REVIEW_DELETED', userId, isAdmin ? 'Deleted by admin' : 'Deleted by customer');
        await review.save();

        // Recalculate rating
        await this.ratingService.recalculateBanquetRating(banquetId);

        this.logger.log(`Review ${reviewId} deleted by ${userId}`);
    }

    /**
     * Add owner reply
     */
    async addOwnerReply(reviewId: string, ownerId: string, dto: OwnerReplyDto): Promise<ReviewResponseDto> {
        const review = await this.reviewRepository.findById(reviewId);
        if (!review) {
            throw new NotFoundException('Review not found');
        }

        // Verify owner owns the banquet
        const banquet = await this.banquetModel.findById(review.banquetId).exec();
        if (!banquet || banquet.ownerId.toHexString() !== ownerId) {
            throw new ForbiddenException('You can only reply to reviews of your banquets');
        }

        if (review.ownerReply) {
            throw new ConflictException('Owner has already replied to this review');
        }

        review.ownerReply = {
            content: dto.content,
            repliedAt: new Date(),
            repliedBy: ownerId,
        };
        review.addAuditEntry('OWNER_REPLIED', ownerId, 'Owner added reply');
        await review.save();

        this.logger.log(`Owner reply added to review ${reviewId}`);

        return this.mapToResponseDto(review);
    }

    /**
     * Get reviews for banquet (public)
     */
    async getBanquetReviews(
        banquetId: string,
        page: number = 1,
        limit: number = 10,
        sortBy: 'recent' | 'rating_high' | 'rating_low' = 'recent',
    ): Promise<ReviewsPaginatedDto> {
        const { reviews, total } = await this.reviewRepository.getApprovedReviewsForBanquet(
            banquetId,
            page,
            limit,
            sortBy,
        );

        const ratingSummary = await this.ratingService.getRatingSummary(banquetId);

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
            ratingSummary,
        };
    }

    /**
     * Get customer's reviews
     */
    async getCustomerReviews(customerId: string): Promise<ReviewResponseDto[]> {
        const reviews = await this.reviewRepository.getCustomerReviews(customerId);
        return reviews.map(r => this.mapToResponseDto(r));
    }

    // ========== PRIVATE METHODS ==========

    private async findCompletedBooking(customerId: string, banquetId: string): Promise<BookingDocument | null> {
        return this.bookingModel.findOne({
            customerId: new Types.ObjectId(customerId),
            banquetId: new Types.ObjectId(banquetId),
            status: BookingStatus.COMPLETED,
            deletedAt: null,
        }).exec();
    }

    private getDaysSince(date: Date): number {
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    private calculateSpamScore(content: string): number {
        let score = 0;

        // Very short content
        if (content.length < 20) score += 0.3;

        // All caps
        if (content === content.toUpperCase() && content.length > 10) score += 0.2;

        // Excessive exclamation marks
        const exclamations = (content.match(/!/g) || []).length;
        if (exclamations > 5) score += 0.2;

        // Repeated characters
        if (/(.)\1{4,}/.test(content)) score += 0.2;

        return Math.min(score, 1);
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
