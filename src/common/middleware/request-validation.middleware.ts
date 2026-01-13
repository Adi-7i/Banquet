import { Injectable, NestMiddleware, Logger, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Request Validation Middleware
 * Security hardening for payload validation
 */
@Injectable()
export class RequestValidationMiddleware implements NestMiddleware {
    private readonly logger = new Logger(RequestValidationMiddleware.name);

    // Maximum payload sizes
    private readonly MAX_JSON_SIZE = 1024 * 1024; // 1MB
    private readonly MAX_URL_LENGTH = 2048;
    private readonly MAX_HEADER_SIZE = 8192;

    // Blocked patterns (security threats)
    private readonly blockedPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,  // XSS scripts
        /javascript:/gi,                                          // JavaScript URLs
        /on\w+\s*=/gi,                                            // Event handlers
        /\$\{.*\}/g,                                              // Template injection
        /\{\{.*\}\}/g,                                            // Template injection
        /eval\s*\(/gi,                                            // Eval calls
        /constructor\s*\[/gi,                                     // Prototype pollution
        /__proto__/gi,                                            // Prototype pollution
    ];

    use(req: Request, res: Response, next: NextFunction): void {
        try {
            // Check URL length
            if (req.url.length > this.MAX_URL_LENGTH) {
                throw new BadRequestException('URL too long');
            }

            // Check content length
            const contentLength = parseInt(req.headers['content-length'] || '0', 10);
            if (contentLength > this.MAX_JSON_SIZE) {
                throw new BadRequestException('Request body too large');
            }

            // Validate content type for POST/PUT/PATCH
            if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
                const contentType = req.headers['content-type'] || '';
                if (req.body && !contentType.includes('application/json') && !contentType.includes('multipart/form-data')) {
                    // Allow without body
                    if (contentLength > 0) {
                        this.logger.warn(`Invalid content type: ${contentType} for ${req.method} ${req.path}`);
                    }
                }
            }

            // Check for malicious patterns in body
            if (req.body) {
                this.validatePayload(req.body, req.path);
            }

            // Check for malicious patterns in query
            if (req.query) {
                this.validatePayload(req.query, req.path);
            }

            next();
        } catch (error) {
            if (error instanceof BadRequestException || error instanceof ForbiddenException) {
                throw error;
            }
            this.logger.error('Request validation error', error);
            next();
        }
    }

    private validatePayload(data: any, path: string): void {
        const jsonStr = JSON.stringify(data);

        for (const pattern of this.blockedPatterns) {
            if (pattern.test(jsonStr)) {
                this.logger.warn(`Blocked malicious pattern in request to ${path}`);
                throw new ForbiddenException('Malicious content detected');
            }
        }
    }
}
