import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/**
 * Audit action types
 */
export enum AuditAction {
    // Auth actions
    LOGIN_SUCCESS = 'LOGIN_SUCCESS',
    LOGIN_FAILURE = 'LOGIN_FAILURE',
    LOGOUT = 'LOGOUT',
    REGISTER = 'REGISTER',
    PASSWORD_CHANGE = 'PASSWORD_CHANGE',
    PASSWORD_RESET_REQUEST = 'PASSWORD_RESET_REQUEST',
    PASSWORD_RESET_COMPLETE = 'PASSWORD_RESET_COMPLETE',
    TOKEN_REFRESH = 'TOKEN_REFRESH',
    TOKEN_REVOKE = 'TOKEN_REVOKE',

    // User actions
    USER_CREATE = 'USER_CREATE',
    USER_UPDATE = 'USER_UPDATE',
    USER_DELETE = 'USER_DELETE',
    USER_DEACTIVATE = 'USER_DEACTIVATE',
    PROFILE_UPDATE = 'PROFILE_UPDATE',

    // Booking actions
    BOOKING_CREATE = 'BOOKING_CREATE',
    BOOKING_UPDATE = 'BOOKING_UPDATE',
    BOOKING_CANCEL = 'BOOKING_CANCEL',
    BOOKING_CONFIRM = 'BOOKING_CONFIRM',

    // Banquet actions
    BANQUET_CREATE = 'BANQUET_CREATE',
    BANQUET_UPDATE = 'BANQUET_UPDATE',
    BANQUET_DELETE = 'BANQUET_DELETE',

    // Admin actions
    ADMIN_ACTION = 'ADMIN_ACTION',
    PERMISSION_CHANGE = 'PERMISSION_CHANGE',
}

/**
 * Audit severity levels
 */
export enum AuditSeverity {
    INFO = 'INFO',
    WARNING = 'WARNING',
    CRITICAL = 'CRITICAL',
}

export type AuditLogDocument = AuditLog & Document;

/**
 * Audit Log Schema
 * Stores security-relevant actions for compliance and monitoring
 */
@Schema({
    collection: 'audit_logs',
    timestamps: true,
    // Optimize for write-heavy, retention-based queries
    capped: false,
})
export class AuditLog {
    /**
     * The action performed
     */
    @Prop({ required: true, enum: AuditAction, index: true })
    action: AuditAction;

    /**
     * Severity level
     */
    @Prop({ required: true, enum: AuditSeverity, default: AuditSeverity.INFO })
    severity: AuditSeverity;

    /**
     * User who performed the action (null for unauthenticated actions)
     */
    @Prop({ type: Types.ObjectId, ref: 'User', index: true })
    userId?: Types.ObjectId;

    /**
     * Email for actions where user may not have ID yet (registration, failed login)
     */
    @Prop({ index: true })
    email?: string;

    /**
     * Target resource type (e.g., 'User', 'Booking', 'Banquet')
     */
    @Prop()
    resourceType?: string;

    /**
     * Target resource ID
     */
    @Prop({ type: Types.ObjectId, index: true })
    resourceId?: Types.ObjectId;

    /**
     * Human-readable description
     */
    @Prop({ required: true })
    description: string;

    /**
     * Request correlation ID for tracing
     */
    @Prop({ index: true })
    correlationId?: string;

    /**
     * Client IP address
     */
    @Prop()
    ipAddress?: string;

    /**
     * User agent string
     */
    @Prop()
    userAgent?: string;

    /**
     * Additional metadata (sanitized - no sensitive data)
     */
    @Prop({ type: Object })
    metadata?: Record<string, any>;

    /**
     * Whether the action was successful
     */
    @Prop({ default: true })
    success: boolean;

    /**
     * Error message if action failed
     */
    @Prop()
    errorMessage?: string;

    /**
     * Creation timestamp (auto-managed)
     */
    createdAt: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);

// Create compound indexes for common queries
AuditLogSchema.index({ userId: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ correlationId: 1 });
AuditLogSchema.index({ createdAt: -1 }); // For TTL or retention queries

// TTL index - automatically delete logs older than 90 days (configurable)
// AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
