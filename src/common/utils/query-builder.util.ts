import { FilterQuery } from 'mongoose';

/**
 * Query Builder Utility
 * Helps build MongoDB filter queries from DTOs
 */
export class QueryBuilder {
    /**
     * Build text search filter for MongoDB
     */
    static buildTextSearch(
        searchQuery?: string,
        searchFields: string[] = [],
    ): FilterQuery<any> {
        if (!searchQuery || searchFields.length === 0) {
            return {};
        }

        // Create case-insensitive regex search across multiple fields
        const searchRegex = new RegExp(searchQuery, 'i');

        return {
            $or: searchFields.map(field => ({
                [field]: searchRegex,
            })),
        };
    }

    /**
     * Build date range filter
     */
    static buildDateRangeFilter(
        field: string,
        from?: Date | string,
        to?: Date | string,
    ): FilterQuery<any> {
        const filter: any = {};

        if (from || to) {
            filter[field] = {};

            if (from) {
                filter[field].$gte = new Date(from);
            }

            if (to) {
                filter[field].$lte = new Date(to);
            }
        }

        return filter;
    }

    /**
     * Build range filter (for numbers)
     */
    static buildRangeFilter(
        field: string,
        min?: number,
        max?: number,
    ): FilterQuery<any> {
        const filter: any = {};

        if (min !== undefined || max !== undefined) {
            filter[field] = {};

            if (min !== undefined) {
                filter[field].$gte = min;
            }

            if (max !== undefined) {
                filter[field].$lte = max;
            }
        }

        return filter;
    }

    /**
     * Build enum filter (exact match)
     */
    static buildEnumFilter(
        field: string,
        value?: string | string[],
    ): FilterQuery<any> {
        if (!value) {
            return {};
        }

        if (Array.isArray(value)) {
            return { [field]: { $in: value } };
        }

        return { [field]: value };
    }

    /**
     * Build geospatial filter (nearby locations)
     * Uses MongoDB $geoWithin with $centerSphere
     */
    static buildNearbyFilter(
        locationField: string,
        latitude?: number,
        longitude?: number,
        radiusInKm?: number,
    ): FilterQuery<any> {
        if (!latitude || !longitude || !radiusInKm) {
            return {};
        }

        // Convert radius from km to radians (divide by Earth's radius: 6378.1 km)
        const radiusInRadians = radiusInKm / 6378.1;

        return {
            [locationField]: {
                $geoWithin: {
                    $centerSphere: [[longitude, latitude], radiusInRadians],
                },
            },
        };
    }

    /**
     * Build array contains filter
     */
    static buildArrayContainsFilter(
        field: string,
        values?: string[],
    ): FilterQuery<any> {
        if (!values || values.length === 0) {
            return {};
        }

        return {
            [field]: { $in: values },
        };
    }

    /**
     * Merge multiple filters using $and
     */
    static mergeFilters(...filters: FilterQuery<any>[]): FilterQuery<any> {
        const nonEmptyFilters = filters.filter(f => Object.keys(f).length > 0);

        if (nonEmptyFilters.length === 0) {
            return {};
        }

        if (nonEmptyFilters.length === 1) {
            return nonEmptyFilters[0];
        }

        return { $and: nonEmptyFilters };
    }

    /**
     * Build sort object from sort string and order
     */
    static buildSort(
        sortField: string = 'createdAt',
        order: 'asc' | 'desc' = 'desc',
    ): Record<string, 1 | -1> {
        return {
            [sortField]: order === 'asc' ? 1 : -1,
        };
    }

    /**
     * Sanitize filter to prevent NoSQL injection
     * Removes any keys starting with $ or containing .
     */
    static sanitizeFilter(filter: any): any {
        if (typeof filter !== 'object' || filter === null) {
            return filter;
        }

        const sanitized: any = {};

        for (const key in filter) {
            // Skip keys starting with $ or containing .
            if (key.startsWith('$') || key.includes('.')) {
                continue;
            }

            const value = filter[key];

            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                sanitized[key] = this.sanitizeFilter(value);
            } else {
                sanitized[key] = value;
            }
        }

        return sanitized;
    }
}
