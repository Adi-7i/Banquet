import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type IdempotencyRecordDocument = IdempotencyRecord & Document;

/**
 * Idempotency Record Schema
 * Prevents duplicate processing of critical operations
 */
@Schema({
    timestamps: true,
    collection: 'idempotency_records',
})
export class IdempotencyRecord {
    @Prop({ type: String, required: true, unique: true, index: true })
    idempotencyKey: string;

    @Prop({ type: String, required: true })
    operationType: string;

    @Prop({ type: Object })
    requestHash: string;

    @Prop({ type: Object })
    response: Record<string, any>;

    @Prop({ type: Number })
    statusCode: number;

    @Prop({ type: Boolean, default: false })
    isProcessing: boolean;

    @Prop({ type: Date, default: Date.now, index: true })
    expiresAt: Date;
}

export const IdempotencyRecordSchema = SchemaFactory.createForClass(IdempotencyRecord);

// TTL index - records expire after 24 hours
IdempotencyRecordSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 86400 }
);
