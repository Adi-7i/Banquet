import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * Request ID Middleware
 * Generates a unique correlation ID for each request to enable request tracing
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
    /**
     * Request header name for incoming correlation ID
     */
    private readonly HEADER_CORRELATION_ID = 'x-correlation-id';

    /**
     * Request header name for request ID
     */
    private readonly HEADER_REQUEST_ID = 'x-request-id';

    use(req: Request, res: Response, next: NextFunction): void {
        // Use existing correlation ID from header or generate new one
        const correlationId =
            (req.headers[this.HEADER_CORRELATION_ID] as string) ||
            (req.headers[this.HEADER_REQUEST_ID] as string) ||
            randomUUID();

        // Attach correlation ID to request object for downstream use
        (req as any).correlationId = correlationId;

        // Set correlation ID in response headers
        res.setHeader(this.HEADER_CORRELATION_ID, correlationId);
        res.setHeader(this.HEADER_REQUEST_ID, correlationId);

        next();
    }
}

/**
 * Express request extension for TypeScript
 */
declare global {
    namespace Express {
        interface Request {
            correlationId?: string;
        }
    }
}
