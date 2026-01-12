import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Logging interceptor for request/response logging
 * Includes correlation ID for request tracing
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger(LoggingInterceptor.name);

    /**
     * Sensitive fields to exclude from logging
     */
    private readonly sensitiveFields = ['password', 'token', 'secret', 'authorization'];

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const { method, url, body, ip, headers } = request;
        const correlationId = request.correlationId || '-';
        const userAgent = headers['user-agent'] || '-';
        const now = Date.now();

        // Log incoming request with correlation ID
        this.logger.log(
            `[${correlationId.substring(0, 8)}] → ${method} ${url} - IP: ${ip}`,
        );

        // Log request body in development (excluding sensitive fields)
        if (process.env.NODE_ENV === 'development' && body && Object.keys(body).length > 0) {
            const sanitizedBody = this.sanitizeBody(body);
            this.logger.debug(
                `[${correlationId.substring(0, 8)}] Request body: ${JSON.stringify(sanitizedBody)}`,
            );
        }

        return next.handle().pipe(
            tap({
                next: () => {
                    const response = context.switchToHttp().getResponse();
                    const { statusCode } = response;
                    const delay = Date.now() - now;

                    this.logger.log(
                        `[${correlationId.substring(0, 8)}] ← ${method} ${url} ${statusCode} - ${delay}ms`,
                    );
                },
                error: (error) => {
                    const delay = Date.now() - now;
                    this.logger.error(
                        `[${correlationId.substring(0, 8)}] ← ${method} ${url} ERROR - ${delay}ms - ${error.message}`,
                    );
                },
            }),
        );
    }

    /**
     * Remove sensitive fields from request body before logging
     */
    private sanitizeBody(body: Record<string, any>): Record<string, any> {
        const sanitized = { ...body };

        for (const field of this.sensitiveFields) {
            if (sanitized[field]) {
                sanitized[field] = '[REDACTED]';
            }
        }

        return sanitized;
    }
}
