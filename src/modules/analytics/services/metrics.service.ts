import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument, BookingStatus } from '@infrastructure/database/schemas/booking.schema';
import { User, UserDocument } from '@infrastructure/database/schemas/user.schema';
import { AnalyticsEvent, AnalyticsEventDocument, AnalyticsEventType } from '@infrastructure/database/schemas/analytics-event.schema';
import { MetricsSnapshot, MetricsSnapshotDocument, MetricType, MetricPeriod } from '@infrastructure/database/schemas/metrics-snapshot.schema';

/**
 * Metrics Service
 * Aggregates and provides analytics metrics
 */
@Injectable()
export class MetricsService {
    private readonly logger = new Logger(MetricsService.name);

    constructor(
        @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(AnalyticsEvent.name) private eventModel: Model<AnalyticsEventDocument>,
        @InjectModel(MetricsSnapshot.name) private snapshotModel: Model<MetricsSnapshotDocument>,
    ) { }

    /**
     * Get booking funnel metrics
     */
    async getBookingFunnelMetrics(days: number = 30): Promise<{
        views: number;
        started: number;
        completed: number;
        cancelled: number;
        conversionRate: number;
    }> {
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const [views, started, completed, cancelled] = await Promise.all([
            this.eventModel.countDocuments({
                eventType: AnalyticsEventType.BANQUET_VIEW,
                timestamp: { $gte: startDate },
            }).exec(),
            this.eventModel.countDocuments({
                eventType: AnalyticsEventType.BOOKING_STARTED,
                timestamp: { $gte: startDate },
            }).exec(),
            this.eventModel.countDocuments({
                eventType: AnalyticsEventType.BOOKING_COMPLETED,
                timestamp: { $gte: startDate },
            }).exec(),
            this.eventModel.countDocuments({
                eventType: AnalyticsEventType.BOOKING_CANCELLED,
                timestamp: { $gte: startDate },
            }).exec(),
        ]);

        const conversionRate = views > 0 ? (completed / views) * 100 : 0;

        return {
            views,
            started,
            completed,
            cancelled,
            conversionRate: Math.round(conversionRate * 100) / 100,
        };
    }

    /**
     * Get revenue metrics (future-ready)
     */
    async getRevenueMetrics(days: number = 30): Promise<{
        totalRevenue: number;
        averageBookingValue: number;
        totalBookings: number;
        revenueByDay: { date: string; amount: number }[];
    }> {
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const [revenueData, bookingCount, dailyRevenue] = await Promise.all([
            this.bookingModel.aggregate([
                {
                    $match: {
                        status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
                        createdAt: { $gte: startDate },
                        deletedAt: null,
                    },
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: '$pricing.totalAmount' },
                    },
                },
            ]).exec(),
            this.bookingModel.countDocuments({
                status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
                createdAt: { $gte: startDate },
                deletedAt: null,
            }).exec(),
            this.bookingModel.aggregate([
                {
                    $match: {
                        status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
                        createdAt: { $gte: startDate },
                        deletedAt: null,
                    },
                },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        amount: { $sum: '$pricing.totalAmount' },
                    },
                },
                { $sort: { _id: 1 } },
            ]).exec(),
        ]);

        const totalRevenue = revenueData[0]?.total || 0;

        return {
            totalRevenue,
            averageBookingValue: bookingCount > 0 ? totalRevenue / bookingCount : 0,
            totalBookings: bookingCount,
            revenueByDay: dailyRevenue.map(d => ({ date: d._id, amount: d.amount })),
        };
    }

    /**
     * Get user activity metrics
     */
    async getUserActivityMetrics(days: number = 30): Promise<{
        newUsers: number;
        activeUsers: number;
        signupsByDay: { date: string; count: number }[];
    }> {
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const [newUsers, activeUsers, signupsByDay] = await Promise.all([
            this.userModel.countDocuments({
                createdAt: { $gte: startDate },
                deletedAt: null,
            }).exec(),
            this.eventModel.distinct('userId', {
                timestamp: { $gte: startDate },
                userId: { $exists: true },
            }).then(ids => ids.length),
            this.userModel.aggregate([
                { $match: { createdAt: { $gte: startDate }, deletedAt: null } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]).exec(),
        ]);

        return {
            newUsers,
            activeUsers,
            signupsByDay: signupsByDay.map(d => ({ date: d._id, count: d.count })),
        };
    }

    /**
     * Get search analytics
     */
    async getSearchAnalytics(days: number = 7): Promise<{
        totalSearches: number;
        topQueries: { query: string; count: number }[];
        emptyResults: number;
    }> {
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const [totalSearches, topQueries, emptyResults] = await Promise.all([
            this.eventModel.countDocuments({
                eventType: AnalyticsEventType.SEARCH_QUERY,
                timestamp: { $gte: startDate },
            }).exec(),
            this.eventModel.aggregate([
                {
                    $match: {
                        eventType: AnalyticsEventType.SEARCH_QUERY,
                        timestamp: { $gte: startDate },
                    },
                },
                {
                    $group: {
                        _id: '$properties.query',
                        count: { $sum: 1 },
                    },
                },
                { $sort: { count: -1 } },
                { $limit: 10 },
            ]).exec(),
            this.eventModel.countDocuments({
                eventType: AnalyticsEventType.SEARCH_QUERY,
                timestamp: { $gte: startDate },
                'properties.resultsCount': 0,
            }).exec(),
        ]);

        return {
            totalSearches,
            topQueries: topQueries.map(q => ({ query: q._id || 'empty', count: q.count })),
            emptyResults,
        };
    }

    /**
     * Get performance KPIs
     */
    async getPerformanceKPIs(): Promise<{
        avgResponseTime: number;
        errorRate: number;
        requestsPerMinute: number;
        slowRequests: number;
    }> {
        // These would be calculated from performance logs
        // For now, return placeholder structure
        return {
            avgResponseTime: 0,
            errorRate: 0,
            requestsPerMinute: 0,
            slowRequests: 0,
        };
    }
}
