import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as os from 'os';
import { PerformanceLog, PerformanceLogDocument } from '@infrastructure/database/schemas/performance-log.schema';

/**
 * Observability Service
 * System health, performance monitoring, and error tracking
 */
@Injectable()
export class ObservabilityService {
    private readonly logger = new Logger(ObservabilityService.name);
    private requestCounts: Map<string, number> = new Map();
    private lastMinuteRequests = 0;

    constructor(
        @InjectModel(PerformanceLog.name)
        private perfLogModel: Model<PerformanceLogDocument>,
    ) {
        // Reset request counter every minute
        setInterval(() => {
            this.lastMinuteRequests = Array.from(this.requestCounts.values()).reduce((a, b) => a + b, 0);
            this.requestCounts.clear();
        }, 60000);
    }

    /**
     * Log slow request
     */
    async logSlowRequest(
        path: string,
        method: string,
        duration: number,
        correlationId?: string,
        statusCode?: number,
    ): Promise<void> {
        try {
            const log = new this.perfLogModel({
                type: 'SLOW_REQUEST',
                path,
                method,
                duration,
                correlationId,
                statusCode,
                timestamp: new Date(),
                memoryUsage: process.memoryUsage(),
            });
            await log.save();
        } catch (error) {
            this.logger.error('Failed to log slow request', error);
        }
    }

    /**
     * Log error
     */
    async logError(
        path: string,
        method: string,
        error: Error,
        correlationId?: string,
        statusCode?: number,
    ): Promise<void> {
        try {
            const log = new this.perfLogModel({
                type: 'ERROR',
                path,
                method,
                duration: 0,
                correlationId,
                statusCode,
                errorMessage: error.message,
                details: { stack: error.stack },
                timestamp: new Date(),
            });
            await log.save();
        } catch (err) {
            this.logger.error('Failed to log error', err);
        }
    }

    /**
     * Increment request counter
     */
    incrementRequestCount(path: string): void {
        const count = this.requestCounts.get(path) || 0;
        this.requestCounts.set(path, count + 1);
    }

    /**
     * Get system health
     */
    getSystemHealth(): {
        status: string;
        uptime: number;
        memory: {
            used: number;
            total: number;
            percentage: number;
        };
        cpu: {
            loadAverage: number[];
            count: number;
        };
        timestamp: Date;
    } {
        const memoryUsage = process.memoryUsage();
        const totalMemory = os.totalmem();
        const usedMemory = totalMemory - os.freemem();

        return {
            status: 'healthy',
            uptime: process.uptime(),
            memory: {
                used: usedMemory,
                total: totalMemory,
                percentage: Math.round((usedMemory / totalMemory) * 100),
            },
            cpu: {
                loadAverage: os.loadavg(),
                count: os.cpus().length,
            },
            timestamp: new Date(),
        };
    }

    /**
     * Get slow queries/requests
     */
    async getSlowRequests(
        hours: number = 24,
        limit: number = 100,
    ): Promise<PerformanceLogDocument[]> {
        const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);

        return this.perfLogModel
            .find({
                type: 'SLOW_REQUEST',
                timestamp: { $gte: startDate },
            })
            .sort({ duration: -1 })
            .limit(limit)
            .exec();
    }

    /**
     * Get error rates
     */
    async getErrorRates(hours: number = 24): Promise<{
        total: number;
        byPath: { path: string; count: number }[];
        byStatusCode: { code: number; count: number }[];
    }> {
        const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);

        const [total, byPath, byStatusCode] = await Promise.all([
            this.perfLogModel.countDocuments({
                type: 'ERROR',
                timestamp: { $gte: startDate },
            }).exec(),
            this.perfLogModel.aggregate([
                { $match: { type: 'ERROR', timestamp: { $gte: startDate } } },
                { $group: { _id: '$path', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 },
            ]).exec(),
            this.perfLogModel.aggregate([
                { $match: { type: 'ERROR', timestamp: { $gte: startDate } } },
                { $group: { _id: '$statusCode', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]).exec(),
        ]);

        return {
            total,
            byPath: byPath.map(p => ({ path: p._id, count: p.count })),
            byStatusCode: byStatusCode.map(s => ({ code: s._id || 500, count: s.count })),
        };
    }

    /**
     * Get request statistics
     */
    async getRequestStats(hours: number = 24): Promise<{
        requestsPerMinute: number;
        avgResponseTime: number;
        slowRequestCount: number;
    }> {
        const startDate = new Date(Date.now() - hours * 60 * 60 * 1000);

        const [slowStats] = await this.perfLogModel.aggregate([
            { $match: { type: 'SLOW_REQUEST', timestamp: { $gte: startDate } } },
            {
                $group: {
                    _id: null,
                    count: { $sum: 1 },
                    avgDuration: { $avg: '$duration' },
                },
            },
        ]).exec();

        return {
            requestsPerMinute: this.lastMinuteRequests,
            avgResponseTime: slowStats?.avgDuration || 0,
            slowRequestCount: slowStats?.count || 0,
        };
    }
}
