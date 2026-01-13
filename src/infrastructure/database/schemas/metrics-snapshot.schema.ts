import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MetricsSnapshotDocument = MetricsSnapshot & Document;

/**
 * Metric Types
 */
export enum MetricType {
    BOOKING_FUNNEL = 'BOOKING_FUNNEL',
    REVENUE = 'REVENUE',
    USER_ACTIVITY = 'USER_ACTIVITY',
    SEARCH_ANALYTICS = 'SEARCH_ANALYTICS',
    PERFORMANCE = 'PERFORMANCE',
    ERROR_RATE = 'ERROR_RATE',
}

/**
 * Aggregation Period
 */
export enum MetricPeriod {
    HOURLY = 'HOURLY',
    DAILY = 'DAILY',
    WEEKLY = 'WEEKLY',
    MONTHLY = 'MONTHLY',
}

/**
 * Metrics Snapshot Schema
 * Pre-aggregated metrics for fast dashboard queries
 */
@Schema({
    timestamps: true,
    collection: 'metrics_snapshots',
})
export class MetricsSnapshot {
    @Prop({ type: String, enum: MetricType, required: true, index: true })
    metricType: MetricType;

    @Prop({ type: String, enum: MetricPeriod, required: true })
    period: MetricPeriod;

    @Prop({ type: Date, required: true, index: true })
    timestamp: Date;

    @Prop({ type: Object, required: true })
    data: Record<string, any>;

    @Prop({ type: Date, default: Date.now })
    aggregatedAt: Date;
}

export const MetricsSnapshotSchema = SchemaFactory.createForClass(MetricsSnapshot);

// Compound index for efficient querying
MetricsSnapshotSchema.index({ metricType: 1, period: 1, timestamp: -1 });

// TTL for hourly metrics (1 year)
MetricsSnapshotSchema.index(
    { timestamp: 1 },
    {
        expireAfterSeconds: 365 * 24 * 60 * 60,
        partialFilterExpression: { period: MetricPeriod.HOURLY }
    }
);
