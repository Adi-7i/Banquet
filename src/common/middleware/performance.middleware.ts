import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ObservabilityService } from '@modules/analytics/services/observability.service';

/**
 * Performance Tracking Middleware
 * Tracks request timing and logs slow requests
 */
@Injectable()
export class PerformanceMiddleware implements NestMiddleware {
    private readonly logger = new Logger(PerformanceMiddleware.name);
    private readonly SLOW_REQUEST_THRESHOLD = 1000; // 1 second

    constructor(private readonly observabilityService: ObservabilityService) { }

    use(req: Request, res: Response, next: NextFunction): void {
        const startTime = Date.now();
        const correlationId = req.headers['x-correlation-id'] as string;

        // Track request count
        this.observabilityService.incrementRequestCount(req.path);

        // Track response time on finish
        res.on('finish', () => {
            const duration = Date.now() - startTime;

            // Log slow requests
            if (duration > this.SLOW_REQUEST_THRESHOLD) {
                this.observabilityService.logSlowRequest(
                    req.path,
                    req.method,
                    duration,
                    correlationId,
                    res.statusCode,
                );

                this.logger.warn(
                    `Slow request: ${req.method} ${req.path} - ${duration}ms`,
                );
            }
        });

        next();
    }
}
