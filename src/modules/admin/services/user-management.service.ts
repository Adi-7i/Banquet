import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument, UserRole, UserStatus } from '@infrastructure/database/schemas/user.schema';
import { AuditLogService } from './audit-log.service';
import { AdminAction, EntityType } from '@infrastructure/database/schemas/admin-activity.schema';

/**
 * User Management Service
 * Admin operations for user management
 */
@Injectable()
export class UserManagementService {
    private readonly logger = new Logger(UserManagementService.name);

    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private readonly auditLogService: AuditLogService,
    ) { }

    /**
     * Get all users with pagination and filters
     */
    async getUsers(
        page: number = 1,
        limit: number = 20,
        filters: {
            role?: UserRole;
            status?: UserStatus;
            search?: string;
        } = {},
    ): Promise<{ users: UserDocument[]; total: number }> {
        const query: any = { deletedAt: null };

        if (filters.role) query.role = filters.role;
        if (filters.status) query.status = filters.status;
        if (filters.search) {
            query.$or = [
                { email: { $regex: filters.search, $options: 'i' } },
            ];
        }

        const [users, total] = await Promise.all([
            this.userModel
                .find(query)
                .select('-password -refreshTokens')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .exec(),
            this.userModel.countDocuments(query).exec(),
        ]);

        return { users, total };
    }

    /**
     * Suspend a user
     */
    async suspendUser(
        userId: string,
        adminId: string,
        reason: string,
        ipAddress?: string,
    ): Promise<UserDocument> {
        const user = await this.userModel.findById(userId).exec();
        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (user.status === UserStatus.SUSPENDED) {
            throw new BadRequestException('User is already suspended');
        }

        const previousState = { status: user.status };
        user.status = UserStatus.SUSPENDED;
        await user.save();

        await this.auditLogService.logActivity({
            adminId,
            action: AdminAction.USER_SUSPENDED,
            entityType: EntityType.USER,
            entityId: userId,
            previousState,
            newState: { status: UserStatus.SUSPENDED },
            reason,
            ipAddress,
        });

        this.logger.log(`User ${userId} suspended by admin ${adminId}`);
        return user;
    }

    /**
     * Activate a user
     */
    async activateUser(
        userId: string,
        adminId: string,
        reason: string,
        ipAddress?: string,
    ): Promise<UserDocument> {
        const user = await this.userModel.findById(userId).exec();
        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (user.status === UserStatus.ACTIVE) {
            throw new BadRequestException('User is already active');
        }

        const previousState = { status: user.status };
        user.status = UserStatus.ACTIVE;
        await user.save();

        await this.auditLogService.logActivity({
            adminId,
            action: AdminAction.USER_ACTIVATED,
            entityType: EntityType.USER,
            entityId: userId,
            previousState,
            newState: { status: UserStatus.ACTIVE },
            reason,
            ipAddress,
        });

        this.logger.log(`User ${userId} activated by admin ${adminId}`);
        return user;
    }

    /**
     * Change user role
     */
    async changeUserRole(
        userId: string,
        newRole: UserRole,
        adminId: string,
        reason: string,
        ipAddress?: string,
    ): Promise<UserDocument> {
        const user = await this.userModel.findById(userId).exec();
        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (user.role === newRole) {
            throw new BadRequestException('User already has this role');
        }

        const previousState = { role: user.role };
        user.role = newRole;
        await user.save();

        await this.auditLogService.logActivity({
            adminId,
            action: AdminAction.USER_ROLE_CHANGED,
            entityType: EntityType.USER,
            entityId: userId,
            previousState,
            newState: { role: newRole },
            reason,
            ipAddress,
        });

        this.logger.log(`User ${userId} role changed to ${newRole} by admin ${adminId}`);
        return user;
    }

    /**
     * Get user statistics
     */
    async getUserStats(): Promise<{
        total: number;
        byRole: Record<string, number>;
        byStatus: Record<string, number>;
        recentSignups: number;
    }> {
        const [total, byRole, byStatus, recentSignups] = await Promise.all([
            this.userModel.countDocuments({ deletedAt: null }).exec(),
            this.userModel.aggregate([
                { $match: { deletedAt: null } },
                { $group: { _id: '$role', count: { $sum: 1 } } },
            ]).exec(),
            this.userModel.aggregate([
                { $match: { deletedAt: null } },
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]).exec(),
            this.userModel.countDocuments({
                deletedAt: null,
                createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            }).exec(),
        ]);

        return {
            total,
            byRole: Object.fromEntries(byRole.map(r => [r._id, r.count])),
            byStatus: Object.fromEntries(byStatus.map(s => [s._id, s.count])),
            recentSignups,
        };
    }
}
