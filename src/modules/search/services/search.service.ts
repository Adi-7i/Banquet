import { Injectable, Logger } from '@nestjs/common';
import { SearchRepository } from '../repositories/search.repository';
import { SearchCacheService } from './search-cache.service';
import { SearchAnalyticsService } from './search-analytics.service';
import { SearchBanquetDto } from '../dto/search-banquet.dto';
import {
    SearchResultDto,
    BanquetSearchResultDto,
    SearchMetadataDto,
    SearchFacetsDto,
} from '../dto/search-result.dto';

/**
 * Search Service
 * Orchestrates search operations with caching and analytics
 */
@Injectable()
export class SearchService {
    private readonly logger = new Logger(SearchService.name);

    constructor(
        private readonly searchRepository: SearchRepository,
        private readonly cacheService: SearchCacheService,
        private readonly analyticsService: SearchAnalyticsService,
    ) { }

    /**
     * Main search method with caching and analytics
     */
    async searchBanquets(
        searchDto: SearchBanquetDto,
        userId?: string,
        ipAddress?: string,
    ): Promise<SearchResultDto> {
        const startTime = Date.now();

        // Generate cache key
        const cacheKey = this.cacheService.generateCacheKey(searchDto);

        // Try cache first
        const cachedResult = await this.cacheService.getCachedResults(cacheKey);
        if (cachedResult) {
            // Track analytics asynchronously
            this.trackSearchAsync(searchDto, cachedResult.pagination.total, Date.now() - startTime, true, userId, ipAddress);
            return cachedResult;
        }

        // Execute search
        const { data, total } = await this.searchRepository.searchBanquets(searchDto);
        const queryTimeMs = Date.now() - startTime;

        // Transform results
        const banquets: BanquetSearchResultDto[] = data.map(doc => ({
            id: doc._id.toHexString(),
            name: doc.name,
            description: doc.description,
            city: doc.city,
            address: doc.address,
            capacity: doc.capacity,
            pricing: doc.pricing,
            amenities: doc.amenities,
            images: doc.images || [],
            rating: doc.rating,
            distance: doc.distance ? Math.round(doc.distance * 100) / 100 : undefined,
            createdAt: doc.createdAt,
        }));

        // Build result
        const result: SearchResultDto = {
            data: banquets,
            pagination: {
                total,
                page: searchDto.page || 1,
                limit: searchDto.limit || 10,
                totalPages: Math.ceil(total / (searchDto.limit || 10)),
                hasNext: (searchDto.page || 1) < Math.ceil(total / (searchDto.limit || 10)),
                hasPrev: (searchDto.page || 1) > 1,
            },
            metadata: {
                queryTimeMs,
                cached: false,
                appliedFilters: this.getAppliedFilters(searchDto),
            },
        };

        // Cache result asynchronously
        this.cacheService.setCachedResults(cacheKey, result).catch(err =>
            this.logger.warn(`Failed to cache results: ${err.message}`)
        );

        // Track analytics asynchronously
        this.trackSearchAsync(searchDto, total, queryTimeMs, false, userId, ipAddress);

        return result;
    }

    /**
     * Get search facets for filter UI
     */
    async getSearchFacets(): Promise<SearchFacetsDto> {
        const facets = await this.searchRepository.getSearchFacets();

        // Transform to DTO format
        const cities: Record<string, number> = {};
        facets.cities?.forEach((city: any) => {
            cities[city._id] = city.count;
        });

        const amenities: Record<string, number> = {};
        facets.amenities?.forEach((amenity: any) => {
            amenities[amenity._id] = amenity.count;
        });

        return {
            cities,
            priceRange: {
                min: facets.priceRange?.[0]?.min || 0,
                max: facets.priceRange?.[0]?.max || 5000,
            },
            capacityRange: {
                min: facets.capacityRange?.[0]?.min || 0,
                max: facets.capacityRange?.[0]?.max || 2000,
            },
            amenities,
        };
    }

    /**
     * Get autocomplete suggestions for search
     */
    async getSearchSuggestions(query: string, limit: number = 10): Promise<string[]> {
        if (!query || query.length < 2) {
            return [];
        }

        // Get popular searches that match
        const popularSearches = await this.analyticsService.getPopularSearches(50);

        return popularSearches
            .filter((item: any) => item.query.toLowerCase().includes(query.toLowerCase()))
            .slice(0, limit)
            .map((item: any) => item.query);
    }

    /**
     * Get popular searches
     */
    async getPopularSearches(limit: number = 10): Promise<any[]> {
        return this.analyticsService.getPopularSearches(limit);
    }

    /**
     * Get trending locations
     */
    async getTrendingLocations(limit: number = 10): Promise<any[]> {
        return this.analyticsService.getTrendingLocations(limit);
    }

    /**
     * Get search statistics
     */
    async getSearchStats(): Promise<any> {
        return this.analyticsService.getSearchStats();
    }

    /**
     * Track search analytics asynchronously
     */
    private trackSearchAsync(
        searchDto: SearchBanquetDto,
        resultCount: number,
        queryTimeMs: number,
        cached: boolean,
        userId?: string,
        ipAddress?: string,
    ): void {
        setImmediate(() => {
            this.analyticsService
                .trackSearch(searchDto, resultCount, queryTimeMs, cached, userId, ipAddress)
                .catch(err => this.logger.warn(`Analytics tracking failed: ${err.message}`));
        });
    }

    /**
     * Get applied filters summary
     */
    private getAppliedFilters(searchDto: SearchBanquetDto): Record<string, any> {
        const filters: Record<string, any> = {};

        if (searchDto.text) filters.text = searchDto.text;
        if (searchDto.city) filters.city = searchDto.city;
        if (searchDto.minCapacity) filters.minCapacity = searchDto.minCapacity;
        if (searchDto.maxCapacity) filters.maxCapacity = searchDto.maxCapacity;
        if (searchDto.minPrice) filters.minPrice = searchDto.minPrice;
        if (searchDto.maxPrice) filters.maxPrice = searchDto.maxPrice;
        if (searchDto.amenities) filters.amenities = searchDto.amenities;
        if (searchDto.minRating) filters.minRating = searchDto.minRating;
        if (searchDto.sortBy) filters.sortBy = searchDto.sortBy;
        if (searchDto.latitude && searchDto.longitude) {
            filters.location = { lat: searchDto.latitude, lng: searchDto.longitude };
            if (searchDto.radiusKm) filters.radiusKm = searchDto.radiusKm;
        }

        return filters;
    }
}
