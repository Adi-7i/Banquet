import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '@infrastructure/database/schemas/user.schema';
import { Booking, BookingDocument, BookingStatus } from '@infrastructure/database/schemas/booking.schema';
import { Banquet, BanquetDocument } from '@infrastructure/database/schemas/banquet.schema';
import { Review, ReviewDocument } from '@infrastructure/database/schemas/review.schema';

/**
 * Analytics Service
 * Dashboard metrics and analytics
 */
@Injectable()
export class AnalyticsService {
    private readonly logger = new Logger(AnalyticsService.name);

    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
        @InjectModel(Banquet.name) private banquetModel: Model<BanquetDocument>,
        @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    ) { }

    /**
     * Get dashboard overview
     */
    async getDashboardOverview(): Promise<{
        users: { total: number; newThisWeek: number; newThisMonth: number };
        bookings: { total: number; pending: number; confirmed: number; completed: number };
        banquets: { total: number; published: number; pending: number };
        reviews: { total: number; pending: number; averageRating: number };
    }> {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const [
            totalUsers,
            newUsersWeek,
            newUsersMonth,
            bookingStats,
            banquetStats,
            reviewStats,
        ] = await Promise.all([
            this.userModel.countDocuments({ deletedAt: null }).exec(),
            this.userModel.countDocuments({ deletedAt: null, createdAt: { $gte: weekAgo } }).exec(),
            this.userModel.countDocuments({ deletedAt: null, createdAt: { $gte: monthAgo } }).exec(),
            this.getBookingStats(),
            this.getBanquetStats(),
            this.getReviewStats(),
        ]);

        return {
            users: {
                total: totalUsers,
                newThisWeek: newUsersWeek,
                newThisMonth: newUsersMonth,
            },
            bookings: bookingStats,
            banquets: banquetStats,
            reviews: reviewStats,
        };
    }

    /**
     * Get user growth metrics
     */
    async getUserGrowthMetrics(days: number = 30): Promise<{
        labels: string[];
        data: number[];
        total: number;
    }> {
        const now = new Date();
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        const results = await this.userModel.aggregate([
            { $match: { deletedAt: null, createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]).exec();

        const labels = results.map(r => r._id);
        const data = results.map(r => r.count);
        const total = data.reduce((sum, val) => sum + val, 0);

        return { labels, data, total };
    }

    /**
     * Get booking analytics
     */
    async getBookingAnalytics(days: number = 30): Promise<{
        trend: { labels: string[]; data: number[] };
        byStatus: Record<string, number>;
        totalRevenue: number;
    }> {
        const now = new Date();
        const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        const [trend, byStatus, revenueData] = await Promise.all([
            this.bookingModel.aggregate([
                { $match: { deletedAt: null, createdAt: { $gte: startDate } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]).exec(),
            this.bookingModel.aggregate([
                { $match: { deletedAt: null } },
                { $group: { _id: '$status', count: { $sum: 1 } } },
            ]).exec(),
            this.bookingModel.aggregate([
                {
                    $match: {
                        deletedAt: null,
                        status: { $in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
                    },
                },
                { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } },
            ]).exec(),
        ]);

        return {
            trend: {
                labels: trend.map(t => t._id),
                data: trend.map(t => t.count),
            },
            byStatus: Object.fromEntries(byStatus.map(s => [s._id, s.count])),
            totalRevenue: revenueData[0]?.total || 0,
        };
    }

    /**
     * Get top performing banquets
     */
    async getTopBanquets(limit: number = 10): Promise<any[]> {
        return this.banquetModel.aggregate([
            { $match: { deletedAt: null, status: 'PUBLISHED' } },
            {
                $lookup: {
                    from: 'bookings',
                    localField: '_id',
                    foreignField: 'banquetId',
                    as: 'bookings',
                },
            },
            {
                $project: {
                    name: 1,
                    city: 1,
                    rating: 1,
                    reviewCount: 1,
                    bookingCount: { $size: '$bookings' },
                    revenue: { $sum: '$bookings.pricing.totalAmount' },
                },
            },
            { $sort: { bookingCount: -1, rating: -1 } },
            { $limit: limit },
        ]).exec();
    }

    /**
     * Get top locations
     */
    async getTopLocations(limit: number = 10): Promise<any[]> {
        return this.banquetModel.aggregate([
            { $match: { deletedAt: null, status: 'PUBLISHED' } },
            {
                $group: {
                    _id: '$city',
                    count: { $sum: 1 },
                    avgRating: { $avg: '$rating' },
                },
            },
            { $sort: { count: -1 } },
            { $limit: limit },
            {
                $project: {
                    city: '$_id',
                    count: 1,
                    avgRating: { $round: ['$avgRating', 1] },
                },
            },
        ]).exec();
    }

    private async getBookingStats() {
        const results = await this.bookingModel.aggregate([
            { $match: { deletedAt: null } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    pending: { $sum: { $cond: [{ $eq: ['$status', BookingStatus.PENDING] }, 1, 0] } },
                    confirmed: { $sum: { $cond: [{ $eq: ['$status', BookingStatus.CONFIRMED] }, 1, 0] } },
                    completed: { $sum: { $cond: [{ $eq: ['$status', BookingStatus.COMPLETED] }, 1, 0] } },
                },
            },
        ]).exec();

        return results[0] || { total: 0, pending: 0, confirmed: 0, completed: 0 };
    }

    private async getBanquetStats() {
        const results = await this.banquetModel.aggregate([
            { $match: { deletedAt: null } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    published: { $sum: { $cond: [{ $eq: ['$status', 'PUBLISHED'] }, 1, 0] } },
                    pending: { $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] } },
                },
            },
        ]).exec();

        return results[0] || { total: 0, published: 0, pending: 0 };
    }

    private async getReviewStats() {
        const results = await this.reviewModel.aggregate([
            { $match: { deletedAt: null } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    pending: { $sum: { $cond: [{ $eq: ['$moderationStatus', 'PENDING'] }, 1, 0] } },
                    averageRating: { $avg: '$rating' },
                },
            },
        ]).exec();

        const data = results[0] || { total: 0, pending: 0, averageRating: 0 };
        return {
            total: data.total,
            pending: data.pending,
            averageRating: Math.round((data.averageRating || 0) * 10) / 10,
        };
    }
}
