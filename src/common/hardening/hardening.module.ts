import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GracefulShutdownService } from '@common/services/graceful-shutdown.service';
import { CircuitBreakerService } from '@common/services/circuit-breaker.service';
import { DataMaskingService } from '@common/services/data-masking.service';
import { IdempotencyRecord, IdempotencyRecordSchema } from '@infrastructure/database/schemas/idempotency-record.schema';

/**
 * Hardening Module
 * Production-grade reliability and security services
 */
@Global()
@Module({
    imports: [
        MongooseModule.forFeature([
            { name: IdempotencyRecord.name, schema: IdempotencyRecordSchema },
        ]),
    ],
    providers: [
        GracefulShutdownService,
        CircuitBreakerService,
        DataMaskingService,
    ],
    exports: [
        GracefulShutdownService,
        CircuitBreakerService,
        DataMaskingService,
    ],
})
export class HardeningModule { }
