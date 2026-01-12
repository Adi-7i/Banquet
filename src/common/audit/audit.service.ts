import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
    AuditLog,
    AuditLogDocument,
    AuditAction,
    AuditSeverity,
} from '@infrastructure/database/schemas/audit-log.schema';

/**
 * Audit log entry input
 */
export interface AuditEntry {
    action: AuditAction;
    severity?: AuditSeverity;
    userId?: string;
    email?: string;
    resourceType?: string;
    resourceId?: string;
    description: string;
    correlationId?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
    success?: boolean;
    errorMessage?: string;
}

/**
 * Audit query options
 */
export interface AuditQueryOptions {
    userId?: string;
    action?: AuditAction;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    skip?: number;
}

/**
 * Audit Service
 * Provides centralized audit logging for security-relevant actions
 */
@Injectable()
export class AuditService {
    private readonly logger = new Logger(AuditService.name);

    /**
     * Sensitive fields that should never be logged
     */
    private readonly sensitiveFields = [
        'password',
        'token',
        'secret',
        'authorization',
        'apiKey',
        'refreshToken',
        'accessToken',
    ];

    constructor(
        @InjectModel(AuditLog.name)
        private auditLogModel: Model<AuditLogDocument>,
    ) { }

    /**
     * Log an audit entry
     * Fire-and-forget - does not block the main flow
     */
    async log(entry: AuditEntry): Promise<void> {
        try {
            const sanitizedMetadata = this.sanitizeMetadata(entry.metadata);

            await this.auditLogModel.create({
                action: entry.action,
                severity: entry.severity || AuditSeverity.INFO,
                userId: entry.userId ? new Types.ObjectId(entry.userId) : undefined,
                email: entry.email,
                resourceType: entry.resourceType,
                resourceId: entry.resourceId ? new Types.ObjectId(entry.resourceId) : undefined,
                description: entry.description,
                correlationId: entry.correlationId,
                ipAddress: entry.ipAddress,
                userAgent: this.truncateUserAgent(entry.userAgent),
                metadata: sanitizedMetadata,
                success: entry.success ?? true,
                errorMessage: entry.errorMessage,
            });

            this.logger.debug(
                `Audit: ${entry.action} - ${entry.description}`,
            );
        } catch (error) {
            // Log error but don't throw - audit logging should never break main flow
            this.logger.error('Failed to write audit log', error);
        }
    }

    /**
     * Log authentication success
     */
    async logAuthSuccess(
        userId: string,
        email: string,
        ipAddress?: string,
        userAgent?: string,
        correlationId?: string,
    ): Promise<void> {
        await this.log({
            action: AuditAction.LOGIN_SUCCESS,
            severity: AuditSeverity.INFO,
            userId,
            email,
            description: `User ${email} logged in successfully`,
            ipAddress,
            userAgent,
            correlationId,
        });
    }

    /**
     * Log authentication failure
     */
    async logAuthFailure(
        email: string,
        reason: string,
        ipAddress?: string,
        userAgent?: string,
        correlationId?: string,
    ): Promise<void> {
        await this.log({
            action: AuditAction.LOGIN_FAILURE,
            severity: AuditSeverity.WARNING,
            email,
            description: `Login failed for ${email}: ${reason}`,
            ipAddress,
            userAgent,
            correlationId,
            success: false,
            errorMessage: reason,
        });
    }

    /**
     * Log user registration
     */
    async logRegistration(
        userId: string,
        email: string,
        role: string,
        ipAddress?: string,
        correlationId?: string,
    ): Promise<void> {
        await this.log({
            action: AuditAction.REGISTER,
            severity: AuditSeverity.INFO,
            userId,
            email,
            description: `New user registered: ${email} (${role})`,
            ipAddress,
            correlationId,
            metadata: { role },
        });
    }

    /**
     * Log password change
     */
    async logPasswordChange(
        userId: string,
        email: string,
        correlationId?: string,
    ): Promise<void> {
        await this.log({
            action: AuditAction.PASSWORD_CHANGE,
            severity: AuditSeverity.WARNING,
            userId,
            email,
            description: `Password changed for ${email}`,
            correlationId,
        });
    }

    /**
     * Log logout
     */
    async logLogout(
        userId: string,
        email: string,
        correlationId?: string,
    ): Promise<void> {
        await this.log({
            action: AuditAction.LOGOUT,
            severity: AuditSeverity.INFO,
            userId,
            email,
            description: `User ${email} logged out`,
            correlationId,
        });
    }

    /**
     * Log sensitive action
     */
    async logSensitiveAction(
        action: AuditAction,
        userId: string,
        description: string,
        resourceType?: string,
        resourceId?: string,
        correlationId?: string,
    ): Promise<void> {
        await this.log({
            action,
            severity: AuditSeverity.CRITICAL,
            userId,
            resourceType,
            resourceId,
            description,
            correlationId,
        });
    }

    /**
     * Query audit logs
     */
    async query(options: AuditQueryOptions): Promise<AuditLogDocument[]> {
        const filter: any = {};

        if (options.userId) {
            filter.userId = new Types.ObjectId(options.userId);
        }
        if (options.action) {
            filter.action = options.action;
        }
        if (options.startDate || options.endDate) {
            filter.createdAt = {};
            if (options.startDate) {
                filter.createdAt.$gte = options.startDate;
            }
            if (options.endDate) {
                filter.createdAt.$lte = options.endDate;
            }
        }

        return this.auditLogModel
            .find(filter)
            .sort({ createdAt: -1 })
            .skip(options.skip || 0)
            .limit(options.limit || 100)
            .exec();
    }

    /**
     * Remove sensitive fields from metadata
     */
    private sanitizeMetadata(
        metadata?: Record<string, any>,
    ): Record<string, any> | undefined {
        if (!metadata) return undefined;

        const sanitized = { ...metadata };

        for (const key of Object.keys(sanitized)) {
            if (this.sensitiveFields.some(f =>
                key.toLowerCase().includes(f.toLowerCase())
            )) {
                delete sanitized[key];
            }
        }

        return sanitized;
    }

    /**
     * Truncate user agent to reasonable length
     */
    private truncateUserAgent(userAgent?: string): string | undefined {
        if (!userAgent) return undefined;
        return userAgent.length > 500 ? userAgent.substring(0, 500) : userAgent;
    }
}
