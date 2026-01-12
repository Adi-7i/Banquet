import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Review Photo Response
 */
export class ReviewPhotoResponseDto {
    @ApiProperty()
    url: string;

    @ApiPropertyOptional()
    caption?: string;
}

/**
 * Owner Reply Response
 */
export class OwnerReplyResponseDto {
    @ApiProperty()
    content: string;

    @ApiProperty()
    repliedAt: Date;

    @ApiPropertyOptional()
    repliedBy?: string;
}

/**
 * Review Response DTO
 */
export class ReviewResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    banquetId: string;

    @ApiProperty()
    customerId: string;

    @ApiProperty()
    bookingId: string;

    @ApiProperty()
    rating: number;

    @ApiPropertyOptional()
    title?: string;

    @ApiProperty()
    content: string;

    @ApiProperty({ type: [ReviewPhotoResponseDto] })
    photos: ReviewPhotoResponseDto[];

    @ApiProperty()
    moderationStatus: string;

    @ApiPropertyOptional({ type: OwnerReplyResponseDto })
    ownerReply?: OwnerReplyResponseDto;

    @ApiProperty()
    isEdited: boolean;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}

/**
 * Rating Summary DTO
 */
export class RatingSummaryDto {
    @ApiProperty()
    averageRating: number;

    @ApiProperty()
    totalReviews: number;

    @ApiProperty({ description: 'Distribution of ratings 1-5' })
    distribution: {
        1: number;
        2: number;
        3: number;
        4: number;
        5: number;
    };
}

/**
 * Reviews Paginated Response
 */
export class ReviewsPaginatedDto {
    @ApiProperty({ type: [ReviewResponseDto] })
    data: ReviewResponseDto[];

    @ApiProperty()
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };

    @ApiPropertyOptional({ type: RatingSummaryDto })
    ratingSummary?: RatingSummaryDto;
}
