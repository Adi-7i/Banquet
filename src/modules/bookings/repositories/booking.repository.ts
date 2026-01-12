import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository } from '@infrastructure/database/repositories/base.repository';
import { Booking, BookingDocument, BookingStatus } from '@infrastructure/database/schemas/booking.schema';

/**
 * Booking Repository
 * Data access layer for booking operations
 */
@Injectable()
export class BookingRepository extends BaseRepository<BookingDocument> {
    constructor(@InjectModel(Booking.name) bookingModel: Model<BookingDocument>) {
        super(bookingModel);
    }

    /**
     * Generate unique booking reference
     */
    async generateBookingReference(): Promise<string> {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `BK-${timestamp}-${random}`;
    }

    /**
     * Find booking by reference
     */
    async findByReference(reference: string): Promise<BookingDocument | null> {
        return this.model.findOne({ bookingReference: reference, deletedAt: null }).exec();
    }

    /**
     * Find bookings by customer
     */
    async findByCustomer(
        customerId: string,
        status?: BookingStatus,
    ): Promise<BookingDocument[]> {
        const filter: any = { customerId: new Types.ObjectId(customerId), deletedAt: null };
        if (status) {
            filter.status = status;
        }
        return this.model.find(filter).sort({ eventDate: -1 }).exec();
    }

    /**
     * Find bookings by banquet
     */
    async findByBanquet(
        banquetId: string,
        status?: BookingStatus,
    ): Promise<BookingDocument[]> {
        const filter: any = { banquetId: new Types.ObjectId(banquetId), deletedAt: null };
        if (status) {
            filter.status = status;
        }
        return this.model.find(filter).sort({ eventDate: -1 }).exec();
    }

    /**
     * Check if date is already booked for a banquet
     */
    async isDateBooked(banquetId: string, date: Date): Promise<boolean> {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const booking = await this.model.findOne({
            banquetId: new Types.ObjectId(banquetId),
            eventDate: { $gte: startOfDay, $lte: endOfDay },
            status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
            deletedAt: null,
        }).exec();

        return booking !== null;
    }

    /**
     * Find active bookings for a date range
     */
    async findActiveBookingsInRange(
        banquetId: string,
        startDate: Date,
        endDate: Date,
    ): Promise<BookingDocument[]> {
        return this.model.find({
            banquetId: new Types.ObjectId(banquetId),
            eventDate: { $gte: startDate, $lte: endDate },
            status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
            deletedAt: null,
        }).sort({ eventDate: 1 }).exec();
    }
}
