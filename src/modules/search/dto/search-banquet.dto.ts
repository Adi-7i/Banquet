import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsOptional,
    IsString,
    IsNumber,
    IsArray,
    IsEnum,
    IsDateString,
    Min,
    Max,
    ArrayMinSize,
} from 'class-validator';
import { PaginationQueryDto } from '@common/dto/pagination.dto';

export enum SearchSortBy {
    PRICE_LOW = 'price_low',
    PRICE_HIGH = 'price_high',
    RATING = 'rating',
    DISTANCE = 'distance',
    POPULARITY = 'popularity',
}

/**
 * Comprehensive search DTO for banquet discovery
 */
export class SearchBanquetDto extends PaginationQueryDto {
    @ApiPropertyOptional({
        description: 'Text search in name and description',
        example: 'wedding hall',
    })
    @IsOptional()
    @IsString()
    text?: string;

    @ApiPropertyOptional({
        description: 'Filter by city',
        example: 'Mumbai',
    })
    @IsOptional()
    @IsString()
    city?: string;

    @ApiPropertyOptional({
        description: 'Latitude for location-based search',
        example: 19.0760,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(-90)
    @Max(90)
    latitude?: number;

    @ApiPropertyOptional({
        description: 'Longitude for location-based search',
        example: 72.8777,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(-180)
    @Max(180)
    longitude?: number;

    @ApiPropertyOptional({
        description: 'Search radius in kilometers',
        example: 10,
        minimum: 1,
        maximum: 100,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(100)
    radiusKm?: number;

    @ApiPropertyOptional({
        description: 'Minimum capacity',
        example: 100,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    minCapacity?: number;

    @ApiPropertyOptional({
        description: 'Maximum capacity',
        example: 1000,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    maxCapacity?: number;

    @ApiPropertyOptional({
        description: 'Minimum price per plate',
        example: 500,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    minPrice?: number;

    @ApiPropertyOptional({
        description: 'Maximum price per plate',
        example: 2000,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    maxPrice?: number;

    @ApiPropertyOptional({
        description: 'Required amenities (all must be present)',
        example: ['parking', 'ac', 'catering'],
        type: [String],
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    amenities?: string[];

    @ApiPropertyOptional({
        description: 'Minimum rating',
        example: 4.0,
        minimum: 0,
        maximum: 5,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    @Max(5)
    minRating?: number;

    @ApiPropertyOptional({
        description: 'Check availability on specific date',
        example: '2024-12-25',
    })
    @IsOptional()
    @IsDateString()
    availableDate?: string;

    @ApiPropertyOptional({
        description: 'Sort results by criteria',
        enum: SearchSortBy,
        example: SearchSortBy.PRICE_LOW,
    })
    @IsOptional()
    @IsEnum(SearchSortBy)
    sortBy?: SearchSortBy;
}
