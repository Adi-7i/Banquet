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

        // Stage 1: Base match for published and non-deleted banquets
        const baseMatch: any = {
            status: BanquetStatus.PUBLISHED,
            deletedAt: null,
        };

        // Text search handling
        // Note: $text must be first stage, but so must $geoNear
        // When using geoNear, we use regex instead of $text for compatibility
        const hasGeoSearch = criteria.latitude && criteria.longitude && criteria.radiusKm;

        if (criteria.text) {
            if (hasGeoSearch) {
                // Use regex search when combining with geo (applied in geoNear query)
                baseMatch.$or = [
                    { name: { $regex: criteria.text, $options: 'i' } },
                    { description: { $regex: criteria.text, $options: 'i' } },
                ];
            } else {
                // Use full-text search when NOT using geoNear
                baseMatch.$text = { $search: criteria.text };
            }
        }

        // City filter
        if (criteria.city) {
            baseMatch.city = { $regex: criteria.city, $options: 'i' };
        }

        // Capacity range
        if (criteria.minCapacity !== undefined || criteria.maxCapacity !== undefined) {
            baseMatch.capacity = {};
            if (criteria.minCapacity) baseMatch.capacity.$gte = criteria.minCapacity;
            if (criteria.maxCapacity) baseMatch.capacity.$lte = criteria.maxCapacity;
        }

        // Price range (assumes pricing.perPlate exists)
        if (criteria.minPrice !== undefined || criteria.maxPrice !== undefined) {
            if (criteria.minPrice) baseMatch['pricing.perPlate'] = { $gte: criteria.minPrice };
            if (criteria.maxPrice) {
                baseMatch['pricing.perPlate'] = baseMatch['pricing.perPlate'] || {};
                baseMatch['pricing.perPlate'].$lte = criteria.maxPrice;
            }
        }

        // Amenities filter (all must be present)
        if (criteria.amenities && criteria.amenities.length > 0) {
            // Check if all amenities are present and truthy
            criteria.amenities.forEach(amenity => {
                baseMatch[`amenities.${amenity}`] = true;
            });
        }

        // Rating filter
        if (criteria.minRating) {
            baseMatch.rating = { $gte: criteria.minRating };
        }

        // Geospatial search - $geoNear MUST be first stage if used
        if (hasGeoSearch) {
            // Use $geoNear with all filters (including regex text search)
            pipeline.push({
                $geoNear: {
                    near: {
                        type: 'Point',
                        coordinates: [criteria.longitude!, criteria.latitude!],
                    },
                    distanceField: 'distance',
                    maxDistance: criteria.radiusKm! * 1000, // Convert km to meters
                    spherical: true,
                    query: baseMatch, // All filters including text as regex
                },
            });
        } else {
            // No geospatial search - use regular $match
            pipeline.push({ $match: baseMatch });
        }

        // Add distance calculation if coordinates provided but no radius
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
