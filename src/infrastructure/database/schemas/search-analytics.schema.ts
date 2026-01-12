import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SearchAnalyticsDocument = SearchAnalytics & Document;

/**
 * Search Analytics Schema
 * Tracks user search behavior for analytics and recommendations
 */
@Schema({ collection: 'search_analytics', timestamps: true })
export class SearchAnalytics {
    @Prop({ type: String, index: true })
    query?: string;

    @Prop({ type: Object })
    filters: Record<string, any>;

    @Prop({ type: Types.ObjectId, ref: 'User', index: true })
    userId?: Types.ObjectId;

    @Prop({ type: String })
    ipAddress?: string;

    @Prop({ type: Number, default: 0 })
    resultCount: number;

    @Prop({ type: String, index: true })
    city?: string;

    @Prop({ type: Number })
    latitude?: number;

    @Prop({ type: Number })
    longitude?: number;

    @Prop({ type: String })
    sortBy?: string;

    @Prop({ type: Number })
    queryTimeMs?: number;

    @Prop({ type: Boolean, default: false })
    cached: boolean;
}

export const SearchAnalyticsSchema = SchemaFactory.createForClass(SearchAnalytics);

// Indexes for analytics queries
SearchAnalyticsSchema.index({ query: 'text' });
SearchAnalyticsSchema.index({ createdAt: -1 });
SearchAnalyticsSchema.index({ city: 1, createdAt: -1 });
