import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, throwError, timer } from 'rxjs';
import { retryWhen, mergeMap, finalize } from 'rxjs/operators';

export interface RetryOptions {
    maxRetries?: number;
    delay?: number;
    backoffMultiplier?: number;
    retryableErrors?: string[];
}

/**
 * Retry Interceptor
 * Automatically retries failed operations with exponential backoff
 */
@Injectable()
export class RetryInterceptor implements NestInterceptor {
    private readonly logger = new Logger(RetryInterceptor.name);
    private readonly defaultOptions: Required<RetryOptions> = {
        maxRetries: 3,
        delay: 1000,
        backoffMultiplier: 2,
        retryableErrors: ['ECONNREFUSED', 'ETIMEDOUT', 'ECONNRESET', 'EHOSTUNREACH'],
    };

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const correlationId = request.headers['x-correlation-id'];

        return next.handle().pipe(
            retryWhen(errors =>
                errors.pipe(
                    mergeMap((error, retryCount) => {
                        if (retryCount >= this.defaultOptions.maxRetries) {
                            return throwError(() => error);
                        }

                        if (!this.isRetryable(error)) {
                            return throwError(() => error);
                        }

                        const delay = this.calculateDelay(retryCount);
                        this.logger.warn(
                            `Retry attempt ${retryCount + 1}/${this.defaultOptions.maxRetries} ` +
                            `after ${delay}ms for ${request.method} ${request.path} ` +
                            `[${correlationId}]`
                        );

                        return timer(delay);
                    })
                )
            )
        );
    }

    private isRetryable(error: any): boolean {
        if (error.code && this.defaultOptions.retryableErrors.includes(error.code)) {
            return true;
        }
        // Network errors are retryable
        if (error.message?.includes('network') || error.message?.includes('timeout')) {
            return true;
        }
        return false;
    }

    private calculateDelay(retryCount: number): number {
        return this.defaultOptions.delay * Math.pow(this.defaultOptions.backoffMultiplier, retryCount);
    }
}
