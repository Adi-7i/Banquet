import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PerformanceLogDocument = PerformanceLog & Document;

/**
 * Performance Log Schema
 * Tracks slow queries and performance issues
 */
@Schema({
    timestamps: true,
    collection: 'performance_logs',
})
export class PerformanceLog {
    @Prop({ type: String, required: true, index: true })
    type: string; // 'SLOW_QUERY' | 'SLOW_REQUEST' | 'ERROR' | 'MEMORY_WARNING'

    @Prop({ type: String, required: true })
    path: string;

    @Prop({ type: String, required: true })
    method: string;

    @Prop({ type: Number, required: true })
    duration: number; // milliseconds

    @Prop({ type: Date, default: Date.now, index: true })
    timestamp: Date;

    @Prop({ type: String })
    correlationId?: string;

    @Prop({ type: Object })
    details?: Record<string, any>;

    @Prop({ type: Number })
    statusCode?: number;

    @Prop({ type: String })
    errorMessage?: string;

    @Prop({ type: Object })
    memoryUsage?: {
        heapUsed: number;
        heapTotal: number;
        external: number;
        rss: number;
    };
}

export const PerformanceLogSchema = SchemaFactory.createForClass(PerformanceLog);

// Indexes
PerformanceLogSchema.index({ type: 1, timestamp: -1 });
PerformanceLogSchema.index({ path: 1, timestamp: -1 });
PerformanceLogSchema.index({ duration: -1 });

// TTL index (30 days)
PerformanceLogSchema.index(
    { timestamp: 1 },
    { expireAfterSeconds: 30 * 24 * 60 * 60 }
);
