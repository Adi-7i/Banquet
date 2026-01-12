import { Injectable, Scope, LoggerService as NestLoggerService, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Log context with correlation ID for request tracing
 */
export interface LogContext {
    correlationId?: string;
    userId?: string;
    method?: string;
    path?: string;
    [key: string]: any;
}

/**
 * Structured log entry format
 */
interface LogEntry {
    timestamp: string;
    level: string;
    message: string;
    context?: string;
    correlationId?: string;
    data?: any;
    error?: {
        name: string;
        message: string;
        stack?: string;
    };
}

/**
 * Structured Logger Service
 * Provides JSON-formatted logging with correlation ID support
 */
@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements NestLoggerService {
    private context?: string;
    private correlationId?: string;
    private readonly logLevel: string;
    private readonly isProduction: boolean;

    private readonly LOG_LEVELS: Record<string, number> = {
        error: 0,
        warn: 1,
        log: 2,
        debug: 3,
        verbose: 4,
    };

    constructor(private readonly configService: ConfigService) {
        this.logLevel = this.configService.get<string>('logging.level') || 'debug';
        this.isProduction = this.configService.get<string>('app.env') === 'production';
    }

    /**
     * Set the logger context (typically the class name)
     */
    setContext(context: string): this {
        this.context = context;
        return this;
    }

    /**
     * Set the correlation ID for this logger instance
     */
    setCorrelationId(correlationId: string): this {
        this.correlationId = correlationId;
        return this;
    }

    /**
     * Create a child logger with the given context
     */
    child(context: string): LoggerService {
        const child = new LoggerService(this.configService);
        child.setContext(context);
        if (this.correlationId) {
            child.setCorrelationId(this.correlationId);
        }
        return child;
    }

    /**
     * Log an error message
     */
    error(message: any, trace?: string, context?: string): void {
        if (!this.shouldLog('error')) return;
        this.writeLog('error', message, context, trace);
    }

    /**
     * Log a warning message
     */
    warn(message: any, context?: string): void {
        if (!this.shouldLog('warn')) return;
        this.writeLog('warn', message, context);
    }

    /**
     * Log an info message
     */
    log(message: any, context?: string): void {
        if (!this.shouldLog('log')) return;
        this.writeLog('log', message, context);
    }

    /**
     * Log a debug message
     */
    debug(message: any, context?: string): void {
        if (!this.shouldLog('debug')) return;
        this.writeLog('debug', message, context);
    }

    /**
     * Log a verbose message
     */
    verbose(message: any, context?: string): void {
        if (!this.shouldLog('verbose')) return;
        this.writeLog('verbose', message, context);
    }

    /**
     * Set log levels (NestJS interface requirement)
     */
    setLogLevels?(levels: LogLevel[]): void {
        // Not implemented - we use config-based log levels
    }

    /**
     * Check if we should log at this level
     */
    private shouldLog(level: string): boolean {
        return this.LOG_LEVELS[level] <= this.LOG_LEVELS[this.logLevel];
    }

    /**
     * Write a structured log entry
     */
    private writeLog(level: string, message: any, context?: string, trace?: string): void {
        const logEntry: LogEntry = {
            timestamp: new Date().toISOString(),
            level: level.toUpperCase(),
            message: this.formatMessage(message),
            context: context || this.context,
            correlationId: this.correlationId,
        };

        // Handle error objects
        if (message instanceof Error) {
            logEntry.error = {
                name: message.name,
                message: message.message,
                stack: this.isProduction ? undefined : message.stack,
            };
        }

        // Add stack trace if provided
        if (trace && !this.isProduction) {
            logEntry.error = logEntry.error || { name: 'Error', message: '' };
            logEntry.error.stack = trace;
        }

        // Output as JSON in production, pretty-print in development
        if (this.isProduction) {
            console.log(JSON.stringify(logEntry));
        } else {
            const coloredLevel = this.colorize(level, logEntry.level);
            const contextStr = logEntry.context ? `[${logEntry.context}]` : '';
            const correlationStr = logEntry.correlationId ? `[${logEntry.correlationId.substring(0, 8)}]` : '';

            console.log(
                `${logEntry.timestamp} ${coloredLevel} ${contextStr}${correlationStr} ${logEntry.message}`
            );

            if (logEntry.error?.stack) {
                console.log(logEntry.error.stack);
            }
        }
    }

    /**
     * Format message to string
     */
    private formatMessage(message: any): string {
        if (typeof message === 'string') {
            return message;
        }
        if (message instanceof Error) {
            return message.message;
        }
        return JSON.stringify(message);
    }

    /**
     * Add ANSI colors for console output (development only)
     */
    private colorize(level: string, text: string): string {
        const colors: Record<string, string> = {
            error: '\x1b[31m',   // Red
            warn: '\x1b[33m',    // Yellow
            log: '\x1b[32m',     // Green
            debug: '\x1b[36m',   // Cyan
            verbose: '\x1b[35m', // Magenta
        };
        const reset = '\x1b[0m';
        return `${colors[level] || ''}${text}${reset}`;
    }
}
