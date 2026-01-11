import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository } from '@infrastructure/database/repositories/base.repository';
import { User, UserDocument } from '@infrastructure/database/schemas/user.schema';

/**
 * Users Repository
 * Data access layer for User operations
 */
@Injectable()
export class UsersRepository extends BaseRepository<UserDocument> {
    constructor(@InjectModel(User.name) userModel: Model<UserDocument>) {
        super(userModel);
    }

    /**
     * Find user by email (case-insensitive)
     */
    async findByEmail(email: string, includeDeleted = false): Promise<UserDocument | null> {
        return this.findOne(
            { email: email.toLowerCase() } as any,
            includeDeleted,
        );
    }

    /**
     * Find user with populated profile (owner or customer)
     */
    async findWithProfile(userId: string): Promise<UserDocument | null> {
        return this.model
            .findOne({ _id: userId, deletedAt: null })
            .exec();
    }

    /**
     * Search users by email or role
     */
    async searchUsers(
        searchQuery?: string,
        role?: string,
        status?: string,
    ): Promise<UserDocument[]> {
        const filter: any = { deletedAt: null };

        if (searchQuery) {
            filter.email = { $regex: searchQuery, $options: 'i' };
        }

        if (role) {
            filter.role = role;
        }

        if (status) {
            filter.status = status;
        }

        return this.model.find(filter).exec();
    }

    /**
     * Update user password
     */
    async updatePassword(userId: string, hashedPassword: string): Promise<UserDocument | null> {
        return this.update(userId, {
            password: hashedPassword,
        } as any);
    }

    /**
     * Update user status
     */
    async updateStatus(userId: string, status: string): Promise<UserDocument | null> {
        return this.update(userId, {
            status,
        } as any);
    }

    /**
     * Check if email exists (excluding current user)
     */
    async emailExists(email: string, excludeUserId?: string): Promise<boolean> {
        const filter: any = {
            email: email.toLowerCase(),
            deletedAt: null,
        };

        if (excludeUserId) {
            filter._id = { $ne: excludeUserId };
        }

        return this.exists(filter);
    }
}
