import { HttpStatus } from '@nestjs/common';
import { ErrorCode, ErrorCodes } from './error-codes';

/**
 * Base Domain Error
 * All domain-specific errors should extend this class
 */
export abstract class DomainError extends Error {
    /**
     * Error code for client identification
     */
    public readonly code: ErrorCode;

    /**
     * HTTP status code to return
     */
    public readonly statusCode: HttpStatus;

    /**
     * Additional context about the error (safe for client)
     */
    public readonly context?: Record<string, any>;

    /**
     * Internal details for logging (not exposed to client)
     */
    public readonly internalDetails?: Record<string, any>;

    constructor(
        message: string,
        code: ErrorCode,
        statusCode: HttpStatus,
        context?: Record<string, any>,
        internalDetails?: Record<string, any>,
    ) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.statusCode = statusCode;
        this.context = context;
        this.internalDetails = internalDetails;

        // Maintains proper stack trace for where error was thrown
        Error.captureStackTrace(this, this.constructor);
    }

    /**
     * Convert error to JSON for API response (safe for client)
     */
    toJSON(): Record<string, any> {
        return {
            code: this.code,
            message: this.message,
            ...(this.context && { context: this.context }),
        };
    }
}

/**
 * Authentication Error
 * Use for login failures, token issues, etc.
 */
export class AuthenticationError extends DomainError {
    constructor(
        message: string = 'Authentication failed',
        code: ErrorCode = ErrorCodes.AUTH_INVALID_CREDENTIALS,
        context?: Record<string, any>,
        internalDetails?: Record<string, any>,
    ) {
        super(message, code, HttpStatus.UNAUTHORIZED, context, internalDetails);
    }
}

/**
 * Authorization Error
 * Use for permission/role-based access failures
 */
export class AuthorizationError extends DomainError {
    constructor(
        message: string = 'Access denied',
        code: ErrorCode = ErrorCodes.AUTHZ_FORBIDDEN,
        context?: Record<string, any>,
        internalDetails?: Record<string, any>,
    ) {
        super(message, code, HttpStatus.FORBIDDEN, context, internalDetails);
    }
}

/**
 * Not Found Error
 * Use when a resource doesn't exist
 */
export class NotFoundError extends DomainError {
    constructor(
        message: string = 'Resource not found',
        code: ErrorCode = ErrorCodes.NOT_FOUND,
        context?: Record<string, any>,
        internalDetails?: Record<string, any>,
    ) {
        super(message, code, HttpStatus.NOT_FOUND, context, internalDetails);
    }
}

/**
 * Validation Error
 * Use for input validation failures
 */
export class ValidationError extends DomainError {
    public readonly errors?: Array<{ field: string; message: string }>;

    constructor(
        message: string = 'Validation failed',
        errors?: Array<{ field: string; message: string }>,
        code: ErrorCode = ErrorCodes.VALIDATION_FAILED,
        internalDetails?: Record<string, any>,
    ) {
        super(message, code, HttpStatus.BAD_REQUEST, { errors }, internalDetails);
        this.errors = errors;
    }

    toJSON(): Record<string, any> {
        return {
            ...super.toJSON(),
            errors: this.errors,
        };
    }
}

/**
 * Conflict Error
 * Use for duplicate resources, concurrency conflicts
 */
export class ConflictError extends DomainError {
    constructor(
        message: string = 'Resource conflict',
        code: ErrorCode = ErrorCodes.CONFLICT,
        context?: Record<string, any>,
        internalDetails?: Record<string, any>,
    ) {
        super(message, code, HttpStatus.CONFLICT, context, internalDetails);
    }
}

/**
 * Business Rule Error
 * Use for domain-specific business logic violations
 */
export class BusinessRuleError extends DomainError {
    constructor(
        message: string,
        code: ErrorCode = ErrorCodes.BAD_REQUEST,
        context?: Record<string, any>,
        internalDetails?: Record<string, any>,
    ) {
        super(message, code, HttpStatus.UNPROCESSABLE_ENTITY, context, internalDetails);
    }
}

/**
 * Rate Limit Error
 * Use when request rate limits are exceeded
 */
export class RateLimitError extends DomainError {
    constructor(
        message: string = 'Too many requests',
        code: ErrorCode = ErrorCodes.AUTH_TOO_MANY_ATTEMPTS,
        context?: Record<string, any>,
        internalDetails?: Record<string, any>,
    ) {
        super(message, code, HttpStatus.TOO_MANY_REQUESTS, context, internalDetails);
    }
}

/**
 * Database Error
 * Use for database-related failures (wrapped for safety)
 */
export class DatabaseError extends DomainError {
    constructor(
        message: string = 'Database operation failed',
        code: ErrorCode = ErrorCodes.DB_QUERY_FAILED,
        internalDetails?: Record<string, any>,
    ) {
        // Never expose internal DB errors to clients
        super(message, code, HttpStatus.INTERNAL_SERVER_ERROR, undefined, internalDetails);
    }
}

/**
 * Internal Error
 * Use for unexpected system errors
 */
export class InternalError extends DomainError {
    constructor(
        message: string = 'An unexpected error occurred',
        internalDetails?: Record<string, any>,
    ) {
        super(message, ErrorCodes.INTERNAL_ERROR, HttpStatus.INTERNAL_SERVER_ERROR, undefined, internalDetails);
    }
}
