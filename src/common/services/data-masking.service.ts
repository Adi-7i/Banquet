import { Injectable } from '@nestjs/common';

/**
 * Sensitive Data Masking Service
 * Masks PII and sensitive data in logs
 */
@Injectable()
export class DataMaskingService {
    private readonly patterns: { pattern: RegExp; replacement: string }[] = [
        // Email addresses
        {
            pattern: /([a-zA-Z0-9._-]+)@([a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi,
            replacement: '***@$2',
        },
        // Phone numbers (various formats)
        {
            pattern: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
            replacement: '***-***-****',
        },
        // Credit card numbers
        {
            pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
            replacement: '****-****-****-****',
        },
        // JWT tokens
        {
            pattern: /eyJ[A-Za-z0-9_-]*\.eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/g,
            replacement: '[JWT_TOKEN]',
        },
        // Authorization headers
        {
            pattern: /Bearer\s+[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/gi,
            replacement: 'Bearer [REDACTED]',
        },
        // Password fields in JSON
        {
            pattern: /"password"\s*:\s*"[^"]*"/gi,
            replacement: '"password":"[REDACTED]"',
        },
        // API keys
        {
            pattern: /api[_-]?key[\'"]?\s*[:=]\s*[\'"]?[A-Za-z0-9_-]{20,}[\'"]?/gi,
            replacement: 'api_key=[REDACTED]',
        },
        // Refresh tokens
        {
            pattern: /"refreshToken"\s*:\s*"[^"]*"/gi,
            replacement: '"refreshToken":"[REDACTED]"',
        },
        // Aadhaar numbers (Indian ID)
        {
            pattern: /\b\d{4}\s?\d{4}\s?\d{4}\b/g,
            replacement: '****-****-****',
        },
        // PAN numbers (Indian tax ID)
        {
            pattern: /[A-Z]{5}[0-9]{4}[A-Z]/g,
            replacement: '*****0000*',
        },
    ];

    /**
     * Mask sensitive data in a string
     */
    mask(data: string): string {
        let masked = data;
        for (const { pattern, replacement } of this.patterns) {
            masked = masked.replace(pattern, replacement);
        }
        return masked;
    }

    /**
     * Mask sensitive data in an object
     */
    maskObject(obj: any): any {
        if (obj === null || obj === undefined) {
            return obj;
        }

        if (typeof obj === 'string') {
            return this.mask(obj);
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.maskObject(item));
        }

        if (typeof obj === 'object') {
            const masked: any = {};
            const sensitiveKeys = new Set([
                'password', 'token', 'secret', 'apiKey', 'api_key',
                'accessToken', 'refreshToken', 'authorization', 'auth',
                'creditCard', 'cardNumber', 'cvv', 'ssn', 'aadhaar',
            ]);

            for (const [key, value] of Object.entries(obj)) {
                if (sensitiveKeys.has(key.toLowerCase())) {
                    masked[key] = '[REDACTED]';
                } else {
                    masked[key] = this.maskObject(value);
                }
            }
            return masked;
        }

        return obj;
    }

    /**
     * Safe stringify for logging
     */
    safeStringify(obj: any): string {
        try {
            const masked = this.maskObject(obj);
            return JSON.stringify(masked);
        } catch {
            return '[Unable to stringify]';
        }
    }
}
