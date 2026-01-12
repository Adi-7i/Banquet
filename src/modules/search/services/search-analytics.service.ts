import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SearchAnalytics, SearchAnalyticsDocument } from '@infrastructure/database/schemas/search-analytics.schema';
import { SearchBanquetDto } from '../dto/search-banquet.dto';

/**
 * Search Analytics Service
 * Tracks and analyzes user search behavior
 */
@Injectable()
export class SearchAnalyticsService {
    private readonly logger = new Logger(SearchAnalyticsService.name);

    constructor(
        @InjectModel(SearchAnalytics.name)
        private searchAnalyticsModel: Model<SearchAnalyticsDocument>,
    ) { }

    /**
     * Track search query (async, non-blocking)
     */
    async trackSearch(
        searchDto: SearchBanquetDto,
        resultCount: number,
        queryTimeMs: number,
        cached: boolean,
        userId?: string,
        ipAddress?: string,
    ): Promise<void> {
        try {
            await this.searchAnalyticsModel.create({
                query: searchDto.text,
                filters: {
                    city: searchDto.city,
                    minCapacity: searchDto.minCapacity,
                    maxCapacity: searchDto.maxCapacity,
                    minPrice: searchDto.minPrice,
                    maxPrice: searchDto.maxPrice,
                    amenities: searchDto.amenities,
                    minRating: searchDto.minRating,
                    sortBy: searchDto.sortBy,
                },
                userId: userId || null,
                ipAddress,
                resultCount,
                city: searchDto.city,
                latitude: searchDto.latitude,
                longitude: searchDto.longitude,
                sortBy: searchDto.sortBy,
                queryTimeMs,
                cached,
            });
        } catch (error) {
            this.logger.warn(`Failed to track search analytics: ${error.message}`);
        }
    }

    /**
     * Get popular search queries
     */
    async getPopularSearches(limit: number = 10): Promise<any[]> {
        return this.searchAnalyticsModel.aggregate([
            {
                $match: {
                    query: { $exists: true, $ne: null },
                    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
                },
            },
            {
                $group: {
                    _id: '$query',
                    count: { $sum: 1 },
                    avgResults: { $avg: '$resultCount' },
                },
            },
            {
                $sort: { count: -1 },
            },
            {
                $limit: limit,
            },
            {
                $project: {
                    _id: 0,
                    query: '$_id',
                    searchCount: '$count',
                    avgResults: { $round: ['$avgResults', 0] },
                },
            },
        ]);
    }

    /**
     * Get trending cities/locations
     */
    async getTrendingLocations(limit: number = 10): Promise<any[]> {
        return this.searchAnalyticsModel.aggregate([
            {
                $match: {
                    city: { $exists: true, $ne: null },
                    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
                },
            },
            {
                $group: {
                    _id: '$city',
                    count: { $sum: 1 },
                },
            },
            {
                $sort: { count: -1 },
            },
            {
                $limit: limit,
            },
            {
                $project: {
                    _id: 0,
                    city: '$_id',
                    searchCount: '$count',
                },
            },
        ]);
    }

    /**
     * Get search statistics
     */
    async getSearchStats(): Promise<any> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [totalSearches, todaySearches, avgQueryTime, cacheHitRate] = await Promise.all([
            this.searchAnalyticsModel.countDocuments(),
            this.searchAnalyticsModel.countDocuments({ createdAt: { $gte: today } }),
            this.searchAnalyticsModel.aggregate([
                { $group: { _id: null, avg: { $avg: '$queryTimeMs' } } },
            ]),
            this.searchAnalyticsModel.aggregate([
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        cached: { $sum: { $cond: ['$cached', 1, 0] } },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        cacheHitRate: {
                            $multiply: [{ $divide: ['$cached', '$total'] }, 100],
                        },
                    },
                },
            ]),
        ]);

        return {
            totalSearches,
            todaySearches,
            avgQueryTimeMs: avgQueryTime[0]?.avg || 0,
            cacheHitRate: cacheHitRate[0]?.cacheHitRate || 0,
        };
    }
}
