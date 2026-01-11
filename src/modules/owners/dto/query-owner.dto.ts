import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '@common/dto/pagination.dto';

/**
 * DTO for querying owners with filters
 */
export class QueryOwnerDto extends PaginationQueryDto {
    @ApiPropertyOptional({
        description: 'Search by business name or description',
        example: 'banquet',
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
}
