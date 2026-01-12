import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainError } from '@common/errors/domain-error';
import { ErrorCodes } from '@common/errors/error-codes';

/**
 * Error response structure
 */
interface ErrorResponse {
    success: false;
    statusCode: number;
    code: string;
    message: string;
    correlationId?: string;
    timestamp: string;
    path: string;
    method: string;
    errors?: any;
}

/**
 * Global HTTP exception filter
 * Provides standardized error responses across the application
 * Handles DomainError, HttpException, and generic errors
 * Ensures no internal details leak in production
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    /**
     * Sensitive fields that should never appear in error responses
     */
    private readonly sensitivePatterns = [
        /password/i,
        /secret/i,
        /token/i,
        /authorization/i,
        /api_key/i,
        /apikey/i,
        /credential/i,
    ];

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const correlationId = request.correlationId || '-';
        const isProduction = process.env.NODE_ENV === 'production';

        // Build error response based on exception type
        const errorResponse = this.buildErrorResponse(
            exception,
            request,
            correlationId,
            isProduction,
        );

        // Log the error with correlation ID
        this.logError(exception, request, correlationId, errorResponse.statusCode);

        // Send response
        response.status(errorResponse.statusCode).json(errorResponse);
    }

    /**
     * Build standardized error response based on exception type
     */
    private buildErrorResponse(
        exception: unknown,
        request: Request,
        correlationId: string,
        isProduction: boolean,
    ): ErrorResponse {
        const sanitizedPath = this.sanitizeUrl(request.url);
        const baseResponse: ErrorResponse = {
            success: false,
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            code: ErrorCodes.INTERNAL_ERROR,
            message: 'An unexpected error occurred',
            correlationId: correlationId !== '-' ? correlationId : undefined,
            timestamp: new Date().toISOString(),
            path: sanitizedPath,
            method: request.method,
        };

        // Handle DomainError (our custom errors)
        if (exception instanceof DomainError) {
            return {
                ...baseResponse,
                statusCode: exception.statusCode,
                code: exception.code,
                message: exception.message,
                ...(exception.context && !isProduction && { context: exception.context }),
                ...((exception as any).errors && { errors: (exception as any).errors }),
            };
        }

        // Handle NestJS HttpException
        if (exception instanceof HttpException) {
            const status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            let message = exception.message;
            let errors: any = null;

            if (typeof exceptionResponse === 'object') {
                const res = exceptionResponse as any;
                message = res.message || exception.message;
                errors = res.errors;
            } else if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            }

            // Map to error code based on status
            const code = this.mapStatusToErrorCode(status);

            return {
                ...baseResponse,
                statusCode: status,
                code,
                message: Array.isArray(message) ? message.join(', ') : message,
                ...(errors && { errors }),
            };
        }

        // Handle generic Error
        if (exception instanceof Error) {
            // Map JWT errors
            if (exception.name === 'JsonWebTokenError') {
                return {
                    ...baseResponse,
                    statusCode: HttpStatus.UNAUTHORIZED,
                    code: ErrorCodes.AUTH_TOKEN_INVALID,
                    message: 'Invalid authentication token',
                };
            }
            if (exception.name === 'TokenExpiredError') {
                return {
                    ...baseResponse,
                    statusCode: HttpStatus.UNAUTHORIZED,
                    code: ErrorCodes.AUTH_TOKEN_EXPIRED,
                    message: 'Authentication token expired',
                };
            }
            if (exception.name === 'NotBeforeError') {
                return {
                    ...baseResponse,
                    statusCode: HttpStatus.UNAUTHORIZED,
                    code: ErrorCodes.AUTH_TOKEN_INVALID,
                    message: 'Token not yet valid',
                };
            }

            // Handle MongoDB duplicate key error
            if (exception.name === 'MongoServerError' && (exception as any).code === 11000) {
                return {
                    ...baseResponse,
                    statusCode: HttpStatus.CONFLICT,
                    code: ErrorCodes.DB_DUPLICATE_KEY,
                    message: 'A record with this value already exists',
                };
            }

            // In production, don't expose error messages
            if (isProduction) {
                return baseResponse;
            }

            // In development, include the actual error message
            return {
                ...baseResponse,
                message: this.sanitizeMessage(exception.message),
            };
        }

        // Unknown error type
        return baseResponse;
    }

    /**
     * Map HTTP status code to error code
     */
    private mapStatusToErrorCode(status: number): string {
        switch (status) {
            case HttpStatus.BAD_REQUEST:
                return ErrorCodes.BAD_REQUEST;
            case HttpStatus.UNAUTHORIZED:
                return ErrorCodes.AUTH_TOKEN_INVALID;
            case HttpStatus.FORBIDDEN:
                return ErrorCodes.AUTHZ_FORBIDDEN;
            case HttpStatus.NOT_FOUND:
                return ErrorCodes.NOT_FOUND;
            case HttpStatus.CONFLICT:
                return ErrorCodes.CONFLICT;
            case HttpStatus.TOO_MANY_REQUESTS:
                return ErrorCodes.AUTH_TOO_MANY_ATTEMPTS;
            case HttpStatus.UNPROCESSABLE_ENTITY:
                return ErrorCodes.VALIDATION_FAILED;
            default:
                return ErrorCodes.INTERNAL_ERROR;
        }
    }

    /**
     * Log error with appropriate level based on status
     */
    private logError(
        exception: unknown,
        request: Request,
        correlationId: string,
        statusCode: number,
    ): void {
        const sanitizedUrl = this.sanitizeUrl(request.url);
        const correlationPrefix = `[${correlationId.substring(0, 8)}]`;
        const requestInfo = `${request.method} ${sanitizedUrl}`;

        // Get stack trace if available
        const stack = exception instanceof Error ? exception.stack : undefined;

        // Log internal details for DomainError
        if (exception instanceof DomainError && exception.internalDetails) {
            this.logger.debug(
                `${correlationPrefix} Internal details: ${JSON.stringify(exception.internalDetails)}`,
            );
        }

        // Log based on status code severity
        if (statusCode >= 500) {
            this.logger.error(
                `${correlationPrefix} ${requestInfo} - ${statusCode}`,
                stack,
            );
        } else if (statusCode >= 400) {
            this.logger.warn(
                `${correlationPrefix} ${requestInfo} - ${statusCode} - ${exception instanceof Error ? exception.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Sanitize URL to remove sensitive query parameters
     */
    private sanitizeUrl(url: string): string {
        const sensitiveParams = ['token', 'password', 'secret', 'apikey', 'api_key', 'refresh_token'];
        let sanitized = url;

        for (const param of sensitiveParams) {
            const regex = new RegExp(`([?&])${param}=[^&]*`, 'gi');
            sanitized = sanitized.replace(regex, `$1${param}=[REDACTED]`);
        }

        return sanitized;
    }

    /**
     * Sanitize error message to remove potentially sensitive information
     */
    private sanitizeMessage(message: string): string {
        let sanitized = message;

        for (const pattern of this.sensitivePatterns) {
            if (pattern.test(sanitized)) {
                sanitized = 'An error occurred processing your request';
                break;
            }
        }

        return sanitized;
    }
}
