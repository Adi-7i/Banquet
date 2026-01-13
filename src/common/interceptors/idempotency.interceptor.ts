import { Injectable, NestInterceptor, ExecutionContext, CallHandler, ConflictException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Observable, of, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import * as crypto from 'crypto';
import { IdempotencyRecord, IdempotencyRecordDocument } from '@infrastructure/database/schemas/idempotency-record.schema';

/**
 * Idempotency Interceptor
 * Prevents duplicate processing of requests with same idempotency key
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
    private readonly logger = new Logger(IdempotencyInterceptor.name);
    private readonly HEADER_NAME = 'x-idempotency-key';

    constructor(
        @InjectModel(IdempotencyRecord.name)
        private idempotencyModel: Model<IdempotencyRecordDocument>,
    ) { }

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();

        // Only apply to POST, PUT, PATCH methods
        if (!['POST', 'PUT', 'PATCH'].includes(request.method)) {
            return next.handle();
        }

        const idempotencyKey = request.headers[this.HEADER_NAME];

        // If no idempotency key provided, proceed normally
        if (!idempotencyKey) {
            return next.handle();
        }

        const operationType = `${request.method}:${request.path}`;
        const requestHash = this.hashRequest(request.body);

        try {
            // Check for existing record
            const existingRecord = await this.idempotencyModel.findOne({ idempotencyKey }).exec();

            if (existingRecord) {
                // Verify request hash matches
                if (existingRecord.requestHash !== requestHash) {
                    throw new ConflictException(
                        'Idempotency key was used with different request body'
                    );
                }

                // If still processing, reject
                if (existingRecord.isProcessing) {
                    throw new ConflictException(
                        'Request is already being processed'
                    );
                }

                // Return cached response
                this.logger.log(`Returning cached response for idempotency key: ${idempotencyKey}`);
                response.status(existingRecord.statusCode);
                return of(existingRecord.response);
            }

            // Create new record in processing state
            await this.idempotencyModel.create({
                idempotencyKey,
                operationType,
                requestHash,
                isProcessing: true,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            });

            // Process request and cache response
            return next.handle().pipe(
                tap(async (responseData) => {
                    await this.idempotencyModel.updateOne(
                        { idempotencyKey },
                        {
                            response: responseData,
                            statusCode: response.statusCode,
                            isProcessing: false,
                        }
                    );
                }),
                catchError(async (error) => {
                    // Remove record on error to allow retry
                    await this.idempotencyModel.deleteOne({ idempotencyKey });
                    return throwError(() => error);
                })
            );
        } catch (error) {
            if (error instanceof ConflictException) {
                throw error;
            }
            // On DB error, proceed without idempotency
            this.logger.error('Idempotency check failed', error);
            return next.handle();
        }
    }

    private hashRequest(body: any): string {
        const content = JSON.stringify(body || {});
        return crypto.createHash('sha256').update(content).digest('hex');
    }
}
