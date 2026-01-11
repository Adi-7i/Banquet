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
 * Useful for debugging and monitoring
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger(LoggingInterceptor.name);

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const { method, url, body } = request;
        const now = Date.now();

        this.logger.log(`→ ${method} ${url}`);

        // Log request body in development (excluding sensitive fields)
        if (process.env.NODE_ENV === 'development' && body) {
            const sanitizedBody = { ...body };
            delete sanitizedBody.password;
            this.logger.debug(`Request body: ${JSON.stringify(sanitizedBody)}`);
        }

        return next.handle().pipe(
            tap({
                next: () => {
                    const response = context.switchToHttp().getResponse();
                    const { statusCode } = response;
                    const delay = Date.now() - now;

                    this.logger.log(
                        `← ${method} ${url} ${statusCode} - ${delay}ms`,
                    );
                },
                error: (error) => {
                    const delay = Date.now() - now;
                    this.logger.error(
                        `← ${method} ${url} ERROR - ${delay}ms`,
                        error.message,
                    );
                },
            }),
        );
    }
}
