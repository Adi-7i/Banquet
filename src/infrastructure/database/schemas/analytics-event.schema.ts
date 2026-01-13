import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AnalyticsEventDocument = AnalyticsEvent & Document;

/**
 * Event Types for analytics tracking
 */
export enum AnalyticsEventType {
    // Page Views
    PAGE_VIEW = 'PAGE_VIEW',

    // Search Events
    SEARCH_QUERY = 'SEARCH_QUERY',
    SEARCH_FILTER = 'SEARCH_FILTER',
    SEARCH_RESULT_CLICK = 'SEARCH_RESULT_CLICK',

    // Booking Funnel
    BANQUET_VIEW = 'BANQUET_VIEW',
    BOOKING_STARTED = 'BOOKING_STARTED',
    BOOKING_COMPLETED = 'BOOKING_COMPLETED',
    BOOKING_CANCELLED = 'BOOKING_CANCELLED',
    BOOKING_PAYMENT = 'BOOKING_PAYMENT',

    // User Events
    USER_SIGNUP = 'USER_SIGNUP',
    USER_LOGIN = 'USER_LOGIN',
    USER_LOGOUT = 'USER_LOGOUT',
    PROFILE_UPDATE = 'PROFILE_UPDATE',

    // Review Events
    REVIEW_CREATED = 'REVIEW_CREATED',
    REVIEW_UPDATED = 'REVIEW_UPDATED',

    // Owner Events
    OWNER_BANQUET_CREATED = 'OWNER_BANQUET_CREATED',
    OWNER_BANQUET_UPDATED = 'OWNER_BANQUET_UPDATED',

    // Custom
    CUSTOM = 'CUSTOM',
}

/**
 * Event Metadata
 */
@Schema({ _id: false })
export class EventMetadata {
    @Prop()
    ip?: string;

    @Prop()
    userAgent?: string;

    @Prop()
    referer?: string;

    @Prop()
    deviceType?: string;

    @Prop()
    browser?: string;

    @Prop()
    os?: string;

    @Prop()
    country?: string;

    @Prop()
    city?: string;
}

/**
 * Analytics Event Schema
 * Time-series ready event collection for user activity tracking
 */
@Schema({
    timestamps: true,
    collection: 'analytics_events',
    timeseries: {
        timeField: 'timestamp',
        metaField: 'metadata',
        granularity: 'hours',
    },
})
export class AnalyticsEvent {
    @Prop({ type: String, enum: AnalyticsEventType, required: true, index: true })
    eventType: AnalyticsEventType;

    @Prop({ type: Types.ObjectId, ref: 'User', index: true })
    userId?: Types.ObjectId;

    @Prop({ type: String, required: true, index: true })
    sessionId: string;

    @Prop({ type: Date, default: Date.now, index: true })
    timestamp: Date;

    @Prop({ type: Object })
    properties?: Record<string, any>;

    @Prop({ type: EventMetadata })
    metadata?: EventMetadata;

    @Prop({ type: Types.ObjectId, ref: 'Banquet' })
    banquetId?: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Booking' })
    bookingId?: Types.ObjectId;
}

export const AnalyticsEventSchema = SchemaFactory.createForClass(AnalyticsEvent);

// ==================================
// INDEXES for efficient querying
// ==================================

AnalyticsEventSchema.index({ eventType: 1, timestamp: -1 });
AnalyticsEventSchema.index({ userId: 1, timestamp: -1 });
AnalyticsEventSchema.index({ sessionId: 1, timestamp: -1 });
AnalyticsEventSchema.index({ banquetId: 1, eventType: 1, timestamp: -1 });

// TTL index for data retention (90 days)
AnalyticsEventSchema.index(
    { timestamp: 1 },
    { expireAfterSeconds: 90 * 24 * 60 * 60 }
);
