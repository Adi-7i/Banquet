import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import {
    AnalyticsEvent,
    AnalyticsEventDocument,
    AnalyticsEventType,
    EventMetadata,
} from '@infrastructure/database/schemas/analytics-event.schema';

export interface TrackEventOptions {
    userId?: string;
    sessionId?: string;
    properties?: Record<string, any>;
    metadata?: Partial<EventMetadata>;
    banquetId?: string;
    bookingId?: string;
}

/**
 * Event Tracker Service
 * Collects analytics events for user activity tracking
 */
@Injectable()
export class EventTrackerService {
    private readonly logger = new Logger(EventTrackerService.name);

    constructor(
        @InjectModel(AnalyticsEvent.name)
        private eventModel: Model<AnalyticsEventDocument>,
    ) { }

    /**
     * Track a generic event
     */
    async trackEvent(
        eventType: AnalyticsEventType,
        options: TrackEventOptions = {},
    ): Promise<void> {
        try {
            const event = new this.eventModel({
                eventType,
                userId: options.userId ? new Types.ObjectId(options.userId) : undefined,
                sessionId: options.sessionId || uuidv4(),
                timestamp: new Date(),
                properties: options.properties,
                metadata: options.metadata,
                banquetId: options.banquetId ? new Types.ObjectId(options.banquetId) : undefined,
                bookingId: options.bookingId ? new Types.ObjectId(options.bookingId) : undefined,
            });

            await event.save();
        } catch (error) {
            // Non-blocking - log error but don't throw
            this.logger.error(`Failed to track event: ${eventType}`, error);
        }
    }

    /**
     * Track page view
     */
    async trackPageView(
        sessionId: string,
        page: string,
        userId?: string,
        metadata?: Partial<EventMetadata>,
    ): Promise<void> {
        await this.trackEvent(AnalyticsEventType.PAGE_VIEW, {
            sessionId,
            userId,
            properties: { page },
            metadata,
        });
    }

    /**
     * Track search query
     */
    async trackSearch(
        sessionId: string,
        query: string,
        resultsCount: number,
        filters?: Record<string, any>,
        userId?: string,
    ): Promise<void> {
        await this.trackEvent(AnalyticsEventType.SEARCH_QUERY, {
            sessionId,
            userId,
            properties: { query, resultsCount, filters },
        });
    }

    /**
     * Track banquet view
     */
    async trackBanquetView(
        sessionId: string,
        banquetId: string,
        userId?: string,
    ): Promise<void> {
        await this.trackEvent(AnalyticsEventType.BANQUET_VIEW, {
            sessionId,
            userId,
            banquetId,
        });
    }

    /**
     * Track booking funnel events
     */
    async trackBookingEvent(
        eventType: AnalyticsEventType,
        bookingId: string,
        banquetId: string,
        userId: string,
        properties?: Record<string, any>,
    ): Promise<void> {
        await this.trackEvent(eventType, {
            userId,
            bookingId,
            banquetId,
            properties,
        });
    }

    /**
     * Get events by type for analytics
     */
    async getEventsByType(
        eventType: AnalyticsEventType,
        startDate: Date,
        endDate: Date,
    ): Promise<AnalyticsEventDocument[]> {
        return this.eventModel
            .find({
                eventType,
                timestamp: { $gte: startDate, $lte: endDate },
            })
            .sort({ timestamp: -1 })
            .limit(1000)
            .exec();
    }

    /**
     * Get event count by type
     */
    async getEventCount(
        eventType: AnalyticsEventType,
        startDate: Date,
        endDate: Date,
    ): Promise<number> {
        return this.eventModel.countDocuments({
            eventType,
            timestamp: { $gte: startDate, $lte: endDate },
        }).exec();
    }

    /**
     * Get event distribution by type
     */
    async getEventDistribution(
        startDate: Date,
        endDate: Date,
    ): Promise<Record<string, number>> {
        const results = await this.eventModel.aggregate([
            { $match: { timestamp: { $gte: startDate, $lte: endDate } } },
            { $group: { _id: '$eventType', count: { $sum: 1 } } },
        ]).exec();

        return Object.fromEntries(results.map(r => [r._id, r.count]));
    }
}
