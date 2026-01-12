import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository } from '@infrastructure/database/repositories/base.repository';
import { Availability, AvailabilityDocument } from '@infrastructure/database/schemas/availability.schema';

/**
 * Availability Repository
 * Data access layer for availability management
 */
@Injectable()
export class AvailabilityRepository extends BaseRepository<AvailabilityDocument> {
    constructor(@InjectModel(Availability.name) availabilityModel: Model<AvailabilityDocument>) {
        super(availabilityModel);
    }

    /**
     * Check if a specific date is available
     */
    async isDateAvailable(banquetId: string, date: Date): Promise<boolean> {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const availability = await this.model.findOne({
            banquetId: new Types.ObjectId(banquetId),
            date: startOfDay,
            deletedAt: null,
        }).exec();

        // If no record exists, assume available (can be configured otherwise)
        return availability ? availability.isAvailable : true;
    }

    /**
     * Get available dates in a range
     */
    async getAvailableDatesInRange(
        banquetId: string,
        startDate: Date,
        endDate: Date,
    ): Promise<Date[]> {
        const availabilities = await this.model.find({
            banquetId: new Types.ObjectId(banquetId),
            date: { $gte: startDate, $lte: endDate },
            isAvailable: true,
            deletedAt: null,
        }).exec();

        return availabilities.map(a => a.date);
    }

    /**
     * Mark a date as unavailable (due to booking or blackout)
     */
    async markDateUnavailable(
        banquetId: string,
        date: Date,
        reason?: string,
    ): Promise<AvailabilityDocument> {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        return this.model.findOneAndUpdate(
            {
                banquetId: new Types.ObjectId(banquetId),
                date: startOfDay,
            },
            {
                $set: {
                    isAvailable: false,
                    blackoutReason: reason,
                    updatedAt: new Date(),
                },
            },
            {
                upsert: true,
                new: true,
            },
        ).exec();
    }

    /**
     * Mark a date as available
     */
    async markDateAvailable(banquetId: string, date: Date): Promise<AvailabilityDocument> {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        return this.model.findOneAndUpdate(
            {
                banquetId: new Types.ObjectId(banquetId),
                date: startOfDay,
            },
            {
                $set: {
                    isAvailable: true,
                    blackoutReason: null,
                    updatedAt: new Date(),
                },
            },
            {
                upsert: true,
                new: true,
            },
        ).exec();
    }

    /**
     * Set blackout dates for a banquet
     */
    async setBlackoutDates(
        banquetId: string,
        dates: Date[],
        reason: string,
    ): Promise<void> {
        const operations = dates.map(date => {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);

            return {
                updateOne: {
                    filter: {
                        banquetId: new Types.ObjectId(banquetId),
                        date: startOfDay,
                    },
                    update: {
                        $set: {
                            isAvailable: false,
                            blackoutReason: reason,
                            updatedAt: new Date(),
                        },
                    },
                    upsert: true,
                },
            };
        });

        await this.model.bulkWrite(operations);
    }

    /**
     * Get calendar for a month
     */
    async getMonthlyCalendar(
        banquetId: string,
        year: number,
        month: number,
    ): Promise<AvailabilityDocument[]> {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);

        return this.model.find({
            banquetId: new Types.ObjectId(banquetId),
            date: { $gte: startDate, $lte: endDate },
            deletedAt: null,
        }).sort({ date: 1 }).exec();
    }
}
