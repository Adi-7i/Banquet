import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '@common/dto/pagination.dto';
import { BanquetStatus } from '@infrastructure/database/schemas/banquet.schema';

/**
 * DTO for querying banquets with filters
 */
export class QueryBanquetDto extends PaginationQueryDto {
    @ApiPropertyOptional({
        description: 'Search by name or description (text search)',
        example: 'royal',
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({
        description: 'Filter by city',
        example: 'Mumbai',
    })
    @IsOptional()
    @IsString()
    city?: string;

    @ApiPropertyOptional({
        description: 'Filter by status',
        enum: BanquetStatus,
        example: BanquetStatus.PUBLISHED,
    })
    @IsOptional()
    @IsEnum(BanquetStatus)
    status?: BanquetStatus;

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
        description: 'Latitude for nearby search',
        example: 19.0760,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    latitude?: number;

    @ApiPropertyOptional({
        description: 'Longitude for nearby search',
        example: 72.8777,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    longitude?: number;

    @ApiPropertyOptional({
        description: 'Radius in kilometers for nearby search',
        example: 10,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    radiusKm?: number;
}
