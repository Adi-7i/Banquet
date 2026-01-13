import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AdminActivityDocument = AdminActivity & Document & {
    createdAt: Date;
    updatedAt: Date;
};

/**
 * Admin Action Types
 */
export enum AdminAction {
    // User Management
    USER_SUSPENDED = 'USER_SUSPENDED',
    USER_ACTIVATED = 'USER_ACTIVATED',
    USER_ROLE_CHANGED = 'USER_ROLE_CHANGED',
    USER_DELETED = 'USER_DELETED',

    // Owner Management
    KYC_APPROVED = 'KYC_APPROVED',
    KYC_REJECTED = 'KYC_REJECTED',
    OWNER_SUSPENDED = 'OWNER_SUSPENDED',
    OWNER_ACTIVATED = 'OWNER_ACTIVATED',

    // Banquet Management
    BANQUET_APPROVED = 'BANQUET_APPROVED',
    BANQUET_REJECTED = 'BANQUET_REJECTED',
    BANQUET_SUSPENDED = 'BANQUET_SUSPENDED',
    BANQUET_FEATURED = 'BANQUET_FEATURED',
    BANQUET_UNFEATURED = 'BANQUET_UNFEATURED',

    // Booking Management
    BOOKING_OVERRIDE = 'BOOKING_OVERRIDE',
    BOOKING_REFUND = 'BOOKING_REFUND',
    BOOKING_CANCELLED_ADMIN = 'BOOKING_CANCELLED_ADMIN',

    // Review Management
    REVIEW_APPROVED = 'REVIEW_APPROVED',
    REVIEW_REJECTED = 'REVIEW_REJECTED',
    REVIEW_DELETED = 'REVIEW_DELETED',

    // Support Tickets
    TICKET_ASSIGNED = 'TICKET_ASSIGNED',
    TICKET_RESOLVED = 'TICKET_RESOLVED',
    TICKET_ESCALATED = 'TICKET_ESCALATED',

    // Settings
    SETTINGS_UPDATED = 'SETTINGS_UPDATED',
    COMMISSION_UPDATED = 'COMMISSION_UPDATED',
}

/**
 * Entity Types for audit
 */
export enum EntityType {
    USER = 'USER',
    OWNER = 'OWNER',
    BANQUET = 'BANQUET',
    BOOKING = 'BOOKING',
    REVIEW = 'REVIEW',
    TICKET = 'TICKET',
    SETTINGS = 'SETTINGS',
}

/**
 * Admin Activity Schema
 * Comprehensive audit log for all admin actions
 */
@Schema({ timestamps: true, collection: 'admin_activities' })
export class AdminActivity {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    adminId: Types.ObjectId;

    @Prop({ type: String, enum: AdminAction, required: true, index: true })
    action: AdminAction;

    @Prop({ type: String, enum: EntityType, required: true })
    entityType: EntityType;

    @Prop({ type: Types.ObjectId, required: true, index: true })
    entityId: Types.ObjectId;

    @Prop({ type: Object })
    previousState?: Record<string, any>;

    @Prop({ type: Object })
    newState?: Record<string, any>;

    @Prop({ type: String, required: true })
    reason: string;

    @Prop({ type: String })
    ipAddress?: string;

    @Prop({ type: String })
    userAgent?: string;

    @Prop({ type: Object })
    metadata?: Record<string, any>;

    @Prop({ type: Boolean, default: false })
    isRolledBack: boolean;

    @Prop({ type: Types.ObjectId, ref: 'AdminActivity' })
    rollbackActivityId?: Types.ObjectId;
}

export const AdminActivitySchema = SchemaFactory.createForClass(AdminActivity);

// ==================================
// INDEXES
// ==================================

AdminActivitySchema.index({ adminId: 1, createdAt: -1 });
AdminActivitySchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
AdminActivitySchema.index({ action: 1, createdAt: -1 });
AdminActivitySchema.index({ createdAt: -1 });
