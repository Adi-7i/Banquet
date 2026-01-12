import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '@infrastructure/cache/redis.service';
import { SearchBanquetDto } from '../dto/search-banquet.dto';
import { SearchResultDto } from '../dto/search-result.dto';
import * as crypto from 'crypto';

/**
 * Search Cache Service
 * Manages caching of search results using Redis
 */
@Injectable()
export class SearchCacheService {
    private readonly logger = new Logger(SearchCacheService.name);
    private readonly CACHE_PREFIX = 'search:banquets:';
    private readonly CACHE_TTL = 300; // 5 minutes

    constructor(private readonly redisService: RedisService) { }

    /**
     * Generate deterministic cache key from search parameters
     */
    generateCacheKey(searchDto: SearchBanquetDto): string {
        // Create normalized object with sorted keys
        const normalized: Record<string, any> = {
            text: searchDto.text,
            city: searchDto.city,
            latitude: searchDto.latitude,
            longitude: searchDto.longitude,
            radiusKm: searchDto.radiusKm,
            minCapacity: searchDto.minCapacity,
            maxCapacity: searchDto.maxCapacity,
            minPrice: searchDto.minPrice,
            maxPrice: searchDto.maxPrice,
            amenities: searchDto.amenities?.sort(),
            minRating: searchDto.minRating,
            availableDate: searchDto.availableDate,
            sortBy: searchDto.sortBy,
            page: searchDto.page,
            limit: searchDto.limit,
        };

        // Remove undefined/null values
        Object.keys(normalized).forEach(
            key => (normalized[key] === undefined || normalized[key] === null) && delete normalized[key]
        );

        // Create hash from normalized params
        const hash = crypto
            .createHash('md5')
            .update(JSON.stringify(normalized))
            .digest('hex');

        return `${this.CACHE_PREFIX}${hash}`;
    }

    /**
     * Get cached search results
     */
    async getCachedResults(cacheKey: string): Promise<SearchResultDto | null> {
        if (!this.redisService.isAvailable()) {
            return null;
        }

        try {
            const cached = await this.redisService.get<SearchResultDto>(cacheKey);

            if (cached) {
                this.logger.debug(`Cache HIT for key: ${cacheKey}`);
                // Mark as cached in metadata
                if (cached.metadata) {
                    cached.metadata.cached = true;
                }
            }

            return cached;
        } catch (error) {
            this.logger.warn(`Error getting cached results: ${error.message}`);
            return null;
        }
    }

    /**
     * Set search results in cache
     */
    async setCachedResults(
        cacheKey: string,
        results: SearchResultDto,
        ttl: number = this.CACHE_TTL,
    ): Promise<void> {
        if (!this.redisService.isAvailable()) {
            return;
        }

        try {
            await this.redisService.set(cacheKey, results, ttl);
            this.logger.debug(`Cached search results with key: ${cacheKey}, TTL: ${ttl}s`);
        } catch (error) {
            this.logger.warn(`Error caching results: ${error.message}`);
        }
    }

    /**
     * Invalidate cache for specific banquet
     * (Called when banquet is updated/deleted)
     */
    async invalidateBanquetCache(banquetId: string): Promise<void> {
        if (!this.redisService.isAvailable()) {
            return;
        }

        try {
            // Delete all search caches (simple approach)
            // In production, consider more granular invalidation
            const deleted = await this.redisService.delPattern(`${this.CACHE_PREFIX}*`);
            this.logger.log(`Invalidated ${deleted} search cache entries for banquet ${banquetId}`);
        } catch (error) {
            this.logger.warn(`Error invalidating cache: ${error.message}`);
        }
    }

    /**
     * Clear all search caches
     */
    async clearAllCaches(): Promise<void> {
        if (!this.redisService.isAvailable()) {
            return;
        }

        try {
            const deleted = await this.redisService.delPattern(`${this.CACHE_PREFIX}*`);
            this.logger.log(`Cleared ${deleted} search cache entries`);
        } catch (error) {
            this.logger.warn(`Error clearing caches: ${error.message}`);
        }
    }
}
