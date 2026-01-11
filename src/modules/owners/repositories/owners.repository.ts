import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository } from '@infrastructure/database/repositories/base.repository';
import { OwnerProfile, OwnerProfileDocument } from '@infrastructure/database/schemas/owner-profile.schema';

/**
 * Owners Repository
 * Data access layer for Owner Profile operations
 */
@Injectable()
export class OwnersRepository extends BaseRepository<OwnerProfileDocument> {
    constructor(@InjectModel(OwnerProfile.name) ownerProfileModel: Model<OwnerProfileDocument>) {
        super(ownerProfileModel);
    }

    /**
     * Find owner profile by user ID
     */
    async findByUserId(userId: string, includeDeleted = false): Promise<OwnerProfileDocument | null> {
        return this.findOne(
            { userId: new Types.ObjectId(userId) } as any,
            includeDeleted,
        );
    }

    /**
     * Search owners by business name or city
     */
    async searchOwners(
        searchQuery?: string,
        city?: string,
    ): Promise<OwnerProfileDocument[]> {
        const filter: any = { deletedAt: null };

        if (searchQuery) {
            filter.$or = [
                { businessName: { $regex: searchQuery, $options: 'i' } },
                { description: { $regex: searchQuery, $options: 'i' } },
            ];
        }

        if (city) {
            filter.city = { $regex: city, $options: 'i' };
        }

        return this.model.find(filter).exec();
    }

    /**
     * Find owners by city
     */
    async findByCity(city: string): Promise<OwnerProfileDocument[]> {
        return this.model
            .find({
                city: { $regex: city, $options: 'i' },
                deletedAt: null,
            })
            .exec();
    }

    /**
     * Update owner profile
     */
    async updateOwnerProfile(
        userId: string,
        data: Partial<OwnerProfileDocument>,
    ): Promise<OwnerProfileDocument | null> {
        return this.model
            .findOneAndUpdate(
                { userId, deletedAt: null },
                data,
                { new: true },
            )
            .exec();
    }

    /**
     * Check if business name exists (excluding current owner)
     */
    async businessNameExists(
        businessName: string,
        excludeUserId?: string,
    ): Promise<boolean> {
        const filter: any = {
            businessName: { $regex: `^${businessName}$`, $options: 'i' },
            deletedAt: null,
        };

        if (excludeUserId) {
            filter.userId = { $ne: excludeUserId };
        }

        return this.exists(filter);
    }
}
