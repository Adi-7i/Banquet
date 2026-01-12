import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditService } from './audit.service';
import { AuditLog, AuditLogSchema } from '@infrastructure/database/schemas/audit-log.schema';

/**
 * Audit Module
 * Provides audit logging capabilities across the application
 */
@Global()
@Module({
    imports: [
        MongooseModule.forFeature([
            { name: AuditLog.name, schema: AuditLogSchema },
        ]),
    ],
    providers: [AuditService],
    exports: [AuditService],
})
export class AuditModule { }
