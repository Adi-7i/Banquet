import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, Max, IsIn, IsString } from 'class-validator';

/**
 * Base pagination query DTO
 * Provides common pagination, sorting, and ordering parameters
 */
export class PaginationQueryDto {
    @ApiPropertyOptional({
        description: 'Page number (1-indexed)',
        minimum: 1,
        default: 1,
        example: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'Number of items per page',
        minimum: 1,
        maximum: 100,
        default: 10,
        example: 10,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 10;

    @ApiPropertyOptional({
        description: 'Field to sort by',
        default: 'createdAt',
        example: 'createdAt',
    })
    @IsOptional()
    @IsString()
    sort?: string = 'createdAt';

    @ApiPropertyOptional({
        description: 'Sort order',
        enum: ['asc', 'desc'],
        default: 'desc',
        example: 'desc',
    })
    @IsOptional()
    @IsIn(['asc', 'desc'])
    order?: 'asc' | 'desc' = 'desc';
}

/**
 * Paginated response wrapper
 */
export class PaginationMetaDto {
    @ApiPropertyOptional({ description: 'Total number of items', example: 100 })
    total: number;

    @ApiPropertyOptional({ description: 'Current page number', example: 1 })
    page: number;

    @ApiPropertyOptional({ description: 'Items per page', example: 10 })
    limit: number;

    @ApiPropertyOptional({ description: 'Total number of pages', example: 10 })
    totalPages: number;

    @ApiPropertyOptional({ description: 'Has next page', example: true })
    hasNext: boolean;

    @ApiPropertyOptional({ description: 'Has previous page', example: false })
    hasPrev: boolean;
}

/**
 * Generic paginated response DTO
 */
export class PaginatedResponseDto<T> {
    data: T[];
    pagination: PaginationMetaDto;

    constructor(data: T[], pagination: PaginationMetaDto) {
        this.data = data;
        this.pagination = pagination;
    }
}
