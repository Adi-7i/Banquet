import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Banquet, BanquetDocument, BanquetStatus } from '@infrastructure/database/schemas/banquet.schema';
import { SearchBanquetDto, SearchSortBy } from '../dto/search-banquet.dto';

/**
 * Search Repository
 * Advanced MongoDB queries for banquet search
 */
@Injectable()
export class SearchRepository {
    private readonly logger = new Logger(SearchRepository.name);

    constructor(@InjectModel(Banquet.name) private banquetModel: Model<BanquetDocument>) { }

    /**
     * Advanced search with aggregation pipeline
     */
    async searchBanquets(searchDto: SearchBanquetDto): Promise<{ data: any[]; total: number }> {
        const { page = 1, limit = 10, sortBy, ...criteria } = searchDto;
        const skip = (page - 1) * limit;

        // Build aggregation pipeline
        const pipeline: any[] = [];

        // Stage 1: Match published and non-deleted banquets
        const matchStage: any = {
            status: BanquetStatus.PUBLISHED,
            deletedAt: null,
        };

        // Text search
        if (criteria.text) {
            matchStage.$text = { $search: criteria.text };
        }

        // City filter
        if (criteria.city) {
            matchStage.city = { $regex: criteria.city, $options: 'i' };
        }

        // Capacity range
        if (criteria.minCapacity !== undefined || criteria.maxCapacity !== undefined) {
            matchStage.capacity = {};
            if (criteria.minCapacity) matchStage.capacity.$gte = criteria.minCapacity;
            if (criteria.maxCapacity) matchStage.capacity.$lte = criteria.maxCapacity;
        }

        // Price range (assumes pricing.perPlate exists)
        if (criteria.minPrice !== undefined || criteria.maxPrice !== undefined) {
            if (criteria.minPrice) matchStage['pricing.perPlate'] = { $gte: criteria.minPrice };
            if (criteria.maxPrice) {
                matchStage['pricing.perPlate'] = matchStage['pricing.perPlate'] || {};
                matchStage['pricing.perPlate'].$lte = criteria.maxPrice;
            }
        }

        // Amenities filter (all must be present)
        if (criteria.amenities && criteria.amenities.length > 0) {
            // Check if all amenities are present and truthy
            criteria.amenities.forEach(amenity => {
                matchStage[`amenities.${amenity}`] = true;
            });
        }

        // Geospatial search
        if (criteria.latitude && criteria.longitude && criteria.radiusKm) {
            // Note: This requires latitude/longitude fields and 2dsphere index
            // For now using radians calculation
            pipeline.push({
                $geoNear: {
                    near: {
                        type: 'Point',
                        coordinates: [criteria.longitude, criteria.latitude],
                    },
                    distanceField: 'distance',
                    maxDistance: criteria.radiusKm * 1000, // Convert km to meters
                    spherical: true,
                    query: matchStage,
                },
            });
        } else {
            pipeline.push({ $match: matchStage });
        }

        // Add distance calculation if geospatial search
        if (criteria.latitude && criteria.longitude && !criteria.radiusKm) {
            pipeline.push({
                $addFields: {
                    distance: {
                        $let: {
                            vars: {
                                lat1: { $degreesToRadians: criteria.latitude },
                                lon1: { $degreesToRadians: criteria.longitude },
                                lat2: { $degreesToRadians: '$latitude' },
                                lon2: { $degreesToRadians: '$longitude' },
                            },
                            in: {
                                $multiply: [
                                    6371, // Earth radius in km
                                    {
                                        $acos: {
                                            $add: [
                                                {
                                                    $multiply: [
                                                        { $sin: '$$lat1' },
                                                        { $sin: '$$lat2' },
                                                    ],
                                                },
                                                {
                                                    $multiply: [
                                                        { $cos: '$$lat1' },
                                                        { $cos: '$$lat2' },
                                                        { $cos: { $subtract: ['$$lon2', '$$lon1'] } },
                                                    ],
                                                },
                                            ],
                                        },
                                    },
                                ],
                            },
                        },
                    },
                },
            });
        }

        // Sorting
        const sortStage = this.buildSortStage(sortBy, criteria.latitude !== undefined);
        if (sortStage) {
            pipeline.push({ $sort: sortStage });
        }

        // Get total count
        const countPipeline = [...pipeline, { $count: 'total' }];
        const countResult = await this.banquetModel.aggregate(countPipeline).exec();
        const total = countResult[0]?.total || 0;

        // Pagination
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: limit });

        // Execute search
        const data = await this.banquetModel.aggregate(pipeline).exec();

        return { data, total };
    }

    /**
     * Build sort stage based on sortBy criteria
     */
    private buildSortStage(sortBy?: SearchSortBy, hasLocation = false): any {
        switch (sortBy) {
            case SearchSortBy.PRICE_LOW:
                return { 'pricing.perPlate': 1 };
            case SearchSortBy.PRICE_HIGH:
                return { 'pricing.perPlate': -1 };
            case SearchSortBy.RATING:
                return { rating: -1, createdAt: -1 };
            case SearchSortBy.DISTANCE:
                return hasLocation ? { distance: 1 } : { createdAt: -1 };
            case SearchSortBy.POPULARITY:
                // TODO: Add popularity score based on bookings/reviews
                return { rating: -1, capacity: -1 };
            default:
                return { createdAt: -1 };
        }
    }

    /**
     * Get search facets (for filter UI)
     */
    async getSearchFacets(): Promise<any> {
        const facets = await this.banquetModel.aggregate([
            {
                $match: {
                    status: BanquetStatus.PUBLISHED,
                    deletedAt: null,
                },
            },
            {
                $facet: {
                    cities: [
                        { $group: { _id: '$city', count: { $sum: 1 } } },
                        { $sort: { count: -1 } },
                    ],
                    priceRange: [
                        {
                            $group: {
                                _id: null,
                                min: { $min: '$pricing.perPlate' },
                                max: { $max: '$pricing.perPlate' },
                            },
                        },
                    ],
                    capacityRange: [
                        {
                            $group: {
                                _id: null,
                                min: { $min: '$capacity' },
                                max: { $max: '$capacity' },
                            },
                        },
                    ],
                    amenities: [
                        { $project: { amenitiesArray: { $objectToArray: '$amenities' } } },
                        { $unwind: '$amenitiesArray' },
                        { $match: { 'amenitiesArray.v': true } },
                        { $group: { _id: '$amenitiesArray.k', count: { $sum: 1 } } },
                        { $sort: { count: -1 } },
                        { $limit: 20 },
                    ],
                },
            },
        ]);

        return facets[0] || {};
    }
}
