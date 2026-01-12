import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationMetaDto } from '@common/dto/pagination.dto';

/**
 * Banquet result with distance calculation
 */
export class BanquetSearchResultDto {
    @ApiProperty({ description: 'Banquet ID' })
    id: string;

    @ApiProperty({ description: 'Banquet name' })
    name: string;

    @ApiPropertyOptional({ description: 'Description' })
    description?: string;

    @ApiProperty({ description: 'City' })
    city: string;

    @ApiProperty({ description: 'Full address' })
    address: string;

    @ApiProperty({ description: 'Capacity' })
    capacity: number;

    @ApiProperty({ description: 'Pricing information' })
    pricing: Record<string, any>;

    @ApiPropertyOptional({ description: 'Amenities' })
    amenities?: Record<string, any>;

    @ApiPropertyOptional({ description: 'Images' })
    images?: string[];

    @ApiPropertyOptional({ description: 'Average rating', example: 4.5 })
    rating?: number;

    @ApiPropertyOptional({ description: 'Distance in kilometers (if location search)', example: 2.5 })
    distance?: number;

    @ApiProperty({ description: 'Created date' })
    createdAt: Date;
}

/**
 * Search facets for filtering UI
 */
export class SearchFacetsDto {
    @ApiProperty({ description: 'Available cities with counts', example: { Mumbai: 10, Delhi: 5 } })
    cities: Record<string, number>;

    @ApiProperty({ description: 'Price range statistics' })
    priceRange: {
        min: number;
        max: number;
    };

    @ApiProperty({ description: 'Capacity range statistics' })
    capacityRange: {
        min: number;
        max: number;
    };

    @ApiProperty({ description: 'Common amenities with counts' })
    amenities: Record<string, number>;
}

/**
 * Search metadata
 */
export class SearchMetadataDto {
    @ApiProperty({ description: 'Query execution time in ms', example: 45 })
    queryTimeMs: number;

    @ApiProperty({ description: 'Whether results were served from cache' })
    cached: boolean;

    @ApiPropertyOptional({ description: 'Applied filters summary' })
    appliedFilters?: Record<string, any>;
}

/**
 * Complete search response
 */
export class SearchResultDto {
    @ApiProperty({ description: 'Search results', type: [BanquetSearchResultDto] })
    data: BanquetSearchResultDto[];

    @ApiProperty({ description: 'Pagination metadata' })
    pagination: PaginationMetaDto;

    @ApiPropertyOptional({ description: 'Search facets for filtering' })
    facets?: SearchFacetsDto;

    @ApiProperty({ description: 'Search metadata' })
    metadata: SearchMetadataDto;
}
