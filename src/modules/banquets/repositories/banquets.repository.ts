import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository } from '@infrastructure/database/repositories/base.repository';
import { Banquet, BanquetDocument, BanquetStatus } from '@infrastructure/database/schemas/banquet.schema';

/**
 * Banquets Repository
 * Data access layer for Banquet operations
 */
@Injectable()
export class BanquetsRepository extends BaseRepository<BanquetDocument> {
    constructor(@InjectModel(Banquet.name) banquetModel: Model<BanquetDocument>) {
        super(banquetModel);
    }

    /**
     * Find banquets by owner ID
     */
    async findByOwnerId(
        ownerId: string,
        status?: BanquetStatus,
    ): Promise<BanquetDocument[]> {
        const filter: any = { ownerId: new Types.ObjectId(ownerId), deletedAt: null };

        if (status) {
            filter.status = status;
        }

        return this.model.find(filter).exec();
    }

    /**
     * Find published banquets only (public)
     */
    async findPublished(): Promise<BanquetDocument[]> {
        return this.model
            .find({
                status: BanquetStatus.PUBLISHED,
                deletedAt: null,
            })
            .exec();
    }

    /**
     * Search banquets with filters
     */
    async searchBanquets(
        searchQuery?: string,
        city?: string,
        status?: BanquetStatus,
        minCapacity?: number,
        maxCapacity?: number,
    ): Promise<BanquetDocument[]> {
        const filter: any = { deletedAt: null };

        // Text search on name and description
        if (searchQuery) {
            filter.$text = { $search: searchQuery };
        }

        // Filter by city
        if (city) {
            filter.city = { $regex: city, $options: 'i' };
        }

        // Filter by status
        if (status) {
            filter.status = status;
        }

        // Filter by capacity range
        if (minCapacity !== undefined || maxCapacity !== undefined) {
            filter.capacity = {};
            if (minCapacity !== undefined) {
                filter.capacity.$gte = minCapacity;
            }
            if (maxCapacity !== undefined) {
                filter.capacity.$lte = maxCapacity;
            }
        }

        return this.model.find(filter).exec();
    }

    /**
     * Find nearby banquets using geospatial query
     */
    async findNearby(
        latitude: number,
        longitude: number,
        radiusInKm: number,
        status?: BanquetStatus,
    ): Promise<BanquetDocument[]> {
        const filter: any = {
            deletedAt: null,
            latitude: { $exists: true, $ne: null },
            longitude: { $exists: true, $ne: null },
        };

        if (status) {
            filter.status = status;
        }

        // Convert radius from km to radians
        const radiusInRadians = radiusInKm / 6378.1;

        filter.$expr = {
            $lte: [
                {
                    $sqrt: {
                        $add: [
                            { $pow: [{ $subtract: ['$latitude', latitude] }, 2] },
                            { $pow: [{ $subtract: ['$longitude', longitude] }, 2] },
                        ],
                    },
                },
                radiusInRadians,
            ],
        };

        return this.model.find(filter).exec();
    }

    /**
     * Update banquet status
     */
    async updateStatus(
        banquetId: string,
        status: BanquetStatus,
    ): Promise<BanquetDocument | null> {
        return this.update(banquetId, { status } as any);
    }

    /**
     * Check if banquet belongs to owner
     */
    async belongsToOwner(banquetId: string, ownerId: string): Promise<boolean> {
        const banquet = await this.findById(banquetId);
        return banquet?.ownerId?.toHexString() === ownerId;
    }
}
