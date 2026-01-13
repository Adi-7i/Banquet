import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AdminActivity, AdminActivityDocument, AdminAction, EntityType } from '@infrastructure/database/schemas/admin-activity.schema';

export interface LogActivityParams {
    adminId: string;
    action: AdminAction;
    entityType: EntityType;
    entityId: string;
    previousState?: Record<string, any>;
    newState?: Record<string, any>;
    reason: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
}

/**
 * Audit Log Service
 * Records all admin actions for audit trail
 */
@Injectable()
export class AuditLogService {
    private readonly logger = new Logger(AuditLogService.name);

    constructor(
        @InjectModel(AdminActivity.name)
        private activityModel: Model<AdminActivityDocument>,
    ) { }

    /**
     * Log an admin action
     */
    async logActivity(params: LogActivityParams): Promise<AdminActivityDocument> {
        const activity = new this.activityModel({
            adminId: new Types.ObjectId(params.adminId),
            action: params.action,
            entityType: params.entityType,
            entityId: new Types.ObjectId(params.entityId),
            previousState: params.previousState,
            newState: params.newState,
            reason: params.reason,
            ipAddress: params.ipAddress,
            userAgent: params.userAgent,
            metadata: params.metadata,
        });

        const saved = await activity.save();

        this.logger.log(
            `Admin action logged: ${params.action} on ${params.entityType}:${params.entityId} by admin:${params.adminId}`
        );

        return saved;
    }

    /**
     * Get activity history for an entity
     */
    async getEntityHistory(
        entityType: EntityType,
        entityId: string,
        page: number = 1,
        limit: number = 20,
    ): Promise<{ activities: AdminActivityDocument[]; total: number }> {
        const filter = {
            entityType,
            entityId: new Types.ObjectId(entityId),
        };

        const [activities, total] = await Promise.all([
            this.activityModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate('adminId', 'email')
                .exec(),
            this.activityModel.countDocuments(filter).exec(),
        ]);

        return { activities, total };
    }

    /**
     * Get admin's activity history
     */
    async getAdminHistory(
        adminId: string,
        page: number = 1,
        limit: number = 20,
    ): Promise<{ activities: AdminActivityDocument[]; total: number }> {
        const filter = { adminId: new Types.ObjectId(adminId) };

        const [activities, total] = await Promise.all([
            this.activityModel
                .find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .exec(),
            this.activityModel.countDocuments(filter).exec(),
        ]);

        return { activities, total };
    }

    /**
     * Get recent activities
     */
    async getRecentActivities(limit: number = 50): Promise<AdminActivityDocument[]> {
        return this.activityModel
            .find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('adminId', 'email')
            .exec();
    }
}
