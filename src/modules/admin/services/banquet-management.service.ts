import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Banquet, BanquetDocument, BanquetStatus } from '@infrastructure/database/schemas/banquet.schema';
import { FeaturedListing, FeaturedListingDocument, FeaturedStatus } from '@infrastructure/database/schemas/featured-listing.schema';
import { AuditLogService } from './audit-log.service';
import { AdminAction, EntityType } from '@infrastructure/database/schemas/admin-activity.schema';

/**
 * Banquet Management Service
 * Admin operations for banquet approval and featured listings
 */
@Injectable()
export class BanquetManagementService {
    private readonly logger = new Logger(BanquetManagementService.name);

    constructor(
        @InjectModel(Banquet.name) private banquetModel: Model<BanquetDocument>,
        @InjectModel(FeaturedListing.name) private featuredModel: Model<FeaturedListingDocument>,
        private readonly auditLogService: AuditLogService,
    ) { }

    /**
     * Get pending banquets for approval
     */
    async getPendingBanquets(
        page: number = 1,
        limit: number = 20,
    ): Promise<{ banquets: BanquetDocument[]; total: number }> {
        const filter = { status: BanquetStatus.PENDING, deletedAt: null };

        const [banquets, total] = await Promise.all([
            this.banquetModel
                .find(filter)
                .populate('ownerId', 'email')
                .sort({ createdAt: 1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .exec(),
            this.banquetModel.countDocuments(filter).exec(),
        ]);

        return { banquets, total };
    }

    /**
     * Approve a banquet
     */
    async approveBanquet(
        banquetId: string,
        adminId: string,
        reason: string,
        ipAddress?: string,
    ): Promise<BanquetDocument> {
        const banquet = await this.banquetModel.findById(banquetId).exec();
        if (!banquet) {
            throw new NotFoundException('Banquet not found');
        }

        if (banquet.status === BanquetStatus.PUBLISHED) {
            throw new BadRequestException('Banquet is already approved');
        }

        const previousState = { status: banquet.status };
        banquet.status = BanquetStatus.PUBLISHED;
        await banquet.save();

        await this.auditLogService.logActivity({
            adminId,
            action: AdminAction.BANQUET_APPROVED,
            entityType: EntityType.BANQUET,
            entityId: banquetId,
            previousState,
            newState: { status: BanquetStatus.PUBLISHED },
            reason,
            ipAddress,
        });

        this.logger.log(`Banquet ${banquetId} approved by admin ${adminId}`);
        return banquet;
    }

    /**
     * Reject a banquet
     */
    async rejectBanquet(
        banquetId: string,
        adminId: string,
        reason: string,
        ipAddress?: string,
    ): Promise<BanquetDocument> {
        const banquet = await this.banquetModel.findById(banquetId).exec();
        if (!banquet) {
            throw new NotFoundException('Banquet not found');
        }

        const previousState = { status: banquet.status };
        banquet.status = BanquetStatus.REJECTED;
        await banquet.save();

        await this.auditLogService.logActivity({
            adminId,
            action: AdminAction.BANQUET_REJECTED,
            entityType: EntityType.BANQUET,
            entityId: banquetId,
            previousState,
            newState: { status: BanquetStatus.REJECTED },
            reason,
            ipAddress,
        });

        this.logger.log(`Banquet ${banquetId} rejected by admin ${adminId}`);
        return banquet;
    }

    /**
     * Feature a banquet
     */
    async featureBanquet(
        banquetId: string,
        adminId: string,
        startDate: Date,
        endDate: Date,
        position: number,
        fee: number,
        ipAddress?: string,
    ): Promise<FeaturedListingDocument> {
        const banquet = await this.banquetModel.findById(banquetId).exec();
        if (!banquet) {
            throw new NotFoundException('Banquet not found');
        }

        if (banquet.status !== BanquetStatus.PUBLISHED) {
            throw new BadRequestException('Only published banquets can be featured');
        }

        const featured = new this.featuredModel({
            banquetId: new Types.ObjectId(banquetId),
            startDate,
            endDate,
            position,
            fee,
            status: new Date() >= startDate ? FeaturedStatus.ACTIVE : FeaturedStatus.SCHEDULED,
            approvedBy: new Types.ObjectId(adminId),
        });

        await featured.save();

        await this.auditLogService.logActivity({
            adminId,
            action: AdminAction.BANQUET_FEATURED,
            entityType: EntityType.BANQUET,
            entityId: banquetId,
            newState: { startDate, endDate, position, fee },
            reason: 'Featured listing created',
            ipAddress,
        });

        this.logger.log(`Banquet ${banquetId} featured by admin ${adminId}`);
        return featured;
    }

    /**
     * Get featured listings
     */
    async getFeaturedListings(): Promise<FeaturedListingDocument[]> {
        return this.featuredModel
            .find({ status: { $in: [FeaturedStatus.ACTIVE, FeaturedStatus.SCHEDULED] } })
            .populate('banquetId', 'name city')
            .sort({ position: 1 })
            .exec();
    }

    /**
     * Get banquet statistics
     */
    async getBanquetStats(): Promise<{
        total: number;
        byStatus: Record<string, number>;
        pendingCount: number;
        featuredCount: number;
    }> {
        const [total, byStatus, pendingCount, featuredCount] = await Promise.all([
            this.banquetModel.countDocuments({ deletedAt: null }).exec(),
            this.banquetModel.aggregate([
                { $match: { deletedAt: null } },
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]).exec(),
            this.banquetModel.countDocuments({ status: BanquetStatus.PENDING, deletedAt: null }).exec(),
            this.featuredModel.countDocuments({ status: FeaturedStatus.ACTIVE }).exec(),
        ]);

        return {
            total,
            byStatus: Object.fromEntries(byStatus.map(s => [s._id, s.count])),
            pendingCount,
            featuredCount,
        };
    }
}
