import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min,
    IsArray,
    ValidateNested,
    ArrayMaxSize,
} from 'class-validator';

/**
 * Review Photo DTO
 */
export class ReviewPhotoDto {
    @ApiProperty({ description: 'Photo URL' })
    @IsNotEmpty()
    @IsString()
    url: string;

    @ApiPropertyOptional({ description: 'Photo caption' })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    caption?: string;
}

/**
 * Create Review DTO
 */
export class CreateReviewDto {
    @ApiProperty({ description: 'Banquet ID', example: '507f1f77bcf86cd799439011' })
    @IsNotEmpty()
    @IsString()
    banquetId: string;

    @ApiProperty({ description: 'Rating (1-5)', example: 5, minimum: 1, maximum: 5 })
    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    @Max(5)
    rating: number;

    @ApiPropertyOptional({ description: 'Review title', maxLength: 100 })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    title?: string;

    @ApiProperty({ description: 'Review content', maxLength: 2000 })
    @IsNotEmpty()
    @IsString()
    @MaxLength(2000)
    content: string;

    @ApiPropertyOptional({ description: 'Review photos (max 5)', type: [ReviewPhotoDto] })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(5)
    @ValidateNested({ each: true })
    @Type(() => ReviewPhotoDto)
    photos?: ReviewPhotoDto[];
}

/**
 * Update Review DTO
 */
export class UpdateReviewDto {
    @ApiPropertyOptional({ description: 'Rating (1-5)', minimum: 1, maximum: 5 })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(5)
    rating?: number;

    @ApiPropertyOptional({ description: 'Review title', maxLength: 100 })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    title?: string;

    @ApiPropertyOptional({ description: 'Review content', maxLength: 2000 })
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    content?: string;

    @ApiPropertyOptional({ description: 'Review photos (max 5)', type: [ReviewPhotoDto] })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(5)
    @ValidateNested({ each: true })
    @Type(() => ReviewPhotoDto)
    photos?: ReviewPhotoDto[];
}

/**
 * Owner Reply DTO
 */
export class OwnerReplyDto {
    @ApiProperty({ description: 'Reply content', maxLength: 1000 })
    @IsNotEmpty()
    @IsString()
    @MaxLength(1000)
    content: string;
}

/**
 * Reject Review DTO
 */
export class RejectReviewDto {
    @ApiProperty({ description: 'Rejection reason' })
    @IsNotEmpty()
    @IsString()
    @MaxLength(500)
    reason: string;
}
