import { Injectable, HttpStatus } from '@nestjs/common';

/**
 * Standard API Response Interface
 */
export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: {
        code: string;
        details?: any;
    };
    meta?: {
        timestamp: string;
        version: string;
        requestId?: string;
    };
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

/**
 * API Response Service
 * Standardized response formatting for all endpoints
 */
@Injectable()
export class ApiResponseService {
    private readonly version = '1.0.0';

    /**
     * Create success response
     */
    success<T>(data: T, message?: string, requestId?: string): ApiResponse<T> {
        return {
            success: true,
            message,
            data,
            meta: {
                timestamp: new Date().toISOString(),
                version: this.version,
                requestId,
            },
        };
    }

    /**
     * Create paginated success response
     */
    paginated<T>(
        data: T[],
        total: number,
        page: number,
        limit: number,
        requestId?: string,
    ): ApiResponse<T[]> {
        const totalPages = Math.ceil(total / limit);

        return {
            success: true,
            data,
            meta: {
                timestamp: new Date().toISOString(),
                version: this.version,
                requestId,
            },
            pagination: {
                page,
                limit,
                total,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
        };
    }

    /**
     * Create error response
     */
    error(
        message: string,
        code: string,
        details?: any,
        requestId?: string,
    ): ApiResponse<never> {
        return {
            success: false,
            message,
            error: {
                code,
                details,
            },
            meta: {
                timestamp: new Date().toISOString(),
                version: this.version,
                requestId,
            },
        };
    }

    /**
     * Create empty success response
     */
    empty(message: string = 'Operation completed', requestId?: string): ApiResponse<null> {
        return {
            success: true,
            message,
            data: null,
            meta: {
                timestamp: new Date().toISOString(),
                version: this.version,
                requestId,
            },
        };
    }
}

/**
 * Common Error Codes
 */
export const ErrorCodes = {
    // Validation
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INVALID_INPUT: 'INVALID_INPUT',

    // Authentication
    AUTH_REQUIRED: 'AUTH_REQUIRED',
    INVALID_TOKEN: 'INVALID_TOKEN',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',

    // Authorization
    FORBIDDEN: 'FORBIDDEN',
    INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

    // Resource
    NOT_FOUND: 'NOT_FOUND',
    ALREADY_EXISTS: 'ALREADY_EXISTS',
    CONFLICT: 'CONFLICT',

    // Business
    BOOKING_UNAVAILABLE: 'BOOKING_UNAVAILABLE',
    PAYMENT_FAILED: 'PAYMENT_FAILED',
    REVIEW_NOT_ALLOWED: 'REVIEW_NOT_ALLOWED',

    // System
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    RATE_LIMITED: 'RATE_LIMITED',

    // Idempotency
    DUPLICATE_REQUEST: 'DUPLICATE_REQUEST',
    REQUEST_IN_PROGRESS: 'REQUEST_IN_PROGRESS',
} as const;
