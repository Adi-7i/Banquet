import { Document, FilterQuery, Model, QueryOptions, UpdateQuery, Types } from 'mongoose';
import { Logger, BadRequestException } from '@nestjs/common';

/**
 * Base document interface with audit and soft delete fields
 */
export interface SoftDeletableDocument {
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string | null;
    updatedBy: string | null;
}

/**
 * Pagination options for queries
 */
export interface PaginationOptions {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
}

/**
 * Paginated result wrapper
 */
export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

/**
 * Base Repository for MongoDB operations
 * Provides common CRUD operations with soft delete support
 * @template T - Document type extending Mongoose Document and SoftDeletableDocument
 */
export abstract class BaseRepository<T extends Document & SoftDeletableDocument> {
    protected readonly logger: Logger;

    constructor(protected readonly model: Model<T>) {
        this.logger = new Logger(this.constructor.name);
    }

    /**
     * Find by ID (excludes soft-deleted by default)
     */
    async findById(id: string, includeDeleted = false): Promise<T | null> {
        // Validate ObjectId format to prevent 500 errors
        if (!Types.ObjectId.isValid(id)) {
            this.logger.warn(`Invalid ObjectId format: ${id}`);
            return null; // Return null instead of throwing, let service handle 404
        }

        const filter: FilterQuery<T> = { _id: id } as FilterQuery<T>;

        if (!includeDeleted) {
            filter.deletedAt = null;
        }

        return this.model.findOne(filter).exec();
    }

    async findOne(filter: FilterQuery<T>, includeDeleted = false): Promise<T | null> {
        const query: any = { ...filter };

        if (!includeDeleted) {
            query.deletedAt = null;
        }

        return this.model.findOne(query).exec();
    }

    async findAll(
        filter: FilterQuery<T> = {} as FilterQuery<T>,
        options: PaginationOptions = {},
        includeDeleted = false,
    ): Promise<PaginatedResult<T>> {
        const {
            page = 1,
            limit = 10,
            sort = 'createdAt',
            order = 'desc',
        } = options;

        const query: any = { ...filter };

        if (!includeDeleted) {
            query.deletedAt = null;
        }

        const skip = (page - 1) * limit;
        const sortOrder = order === 'asc' ? 1 : -1;

        const [data, total] = await Promise.all([
            this.model
                .find(query)
                .sort({ [sort]: sortOrder })
                .skip(skip)
                .limit(limit)
                .exec(),
            this.model.countDocuments(query).exec(),
        ]);

        const totalPages = Math.ceil(total / limit);

        return {
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
        };
    }

    /**
     * Create a new document
     */
    async create(data: Partial<T>): Promise<T> {
        const document = new this.model(data);
        return document.save();
    }

    /**
     * Update a document by ID
     */
    async update(
        id: string,
        data: UpdateQuery<T>,
        options: QueryOptions = {},
    ): Promise<T | null> {
        return this.model
            .findOneAndUpdate(
                { _id: id, deletedAt: null } as FilterQuery<T>,
                data,
                { new: true, ...options },
            )
            .exec();
    }

    /**
     * Soft delete a document by ID
     */
    async softDelete(id: string, deletedBy?: string): Promise<T | null> {
        const updateData: any = {
            deletedAt: new Date(),
        };

        if (deletedBy) {
            updateData.updatedBy = deletedBy;
        }

        return this.model
            .findOneAndUpdate(
                { _id: id, deletedAt: null } as FilterQuery<T>,
                updateData,
                { new: true },
            )
            .exec();
    }

    /**
     * Hard delete a document by ID (permanent)
     */
    async hardDelete(id: string): Promise<boolean> {
        const result = await this.model.deleteOne({ _id: id } as FilterQuery<T>).exec();
        return result.deletedCount > 0;
    }

    /**
     * Count documents matching filter
     */
    async count(filter: FilterQuery<T> = {} as FilterQuery<T>, includeDeleted = false): Promise<number> {
        const query: any = { ...filter };

        if (!includeDeleted) {
            query.deletedAt = null;
        }

        return this.model.countDocuments(query).exec();
    }

    /**
     * Check if document exists
     */
    async exists(filter: FilterQuery<T>, includeDeleted = false): Promise<boolean> {
        const count = await this.count(filter, includeDeleted);
        return count > 0;
    }

    /**
     * Restore a soft-deleted document
     */
    async restore(id: string): Promise<T | null> {
        return this.model
            .findOneAndUpdate(
                { _id: id } as FilterQuery<T>,
                { deletedAt: null, updatedBy: null },
                { new: true },
            )
            .exec();
    }

    /**
     * Find with populated fields
     */
    async findWithPopulate(
        filter: FilterQuery<T>,
        populateFields: string | string[],
        includeDeleted = false,
    ): Promise<T[]> {
        const query: any = { ...filter };

        if (!includeDeleted) {
            query.deletedAt = null;
        }

        let mongoQuery = this.model.find(query);

        if (Array.isArray(populateFields)) {
            populateFields.forEach(field => {
                mongoQuery = mongoQuery.populate(field);
            });
        } else {
            mongoQuery = mongoQuery.populate(populateFields);
        }

        return mongoQuery.exec();
    }

    /**
     * Bulk create documents
     */
    async bulkCreate(items: Partial<T>[]): Promise<any[]> {
        return this.model.insertMany(items) as any;
    }

    /**
     * Update many documents
     */
    async updateMany(
        filter: FilterQuery<T>,
        data: UpdateQuery<T>,
    ): Promise<number> {
        const result = await this.model.updateMany(filter, data).exec();
        return result.modifiedCount;
    }
}
