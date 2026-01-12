import { Injectable, Logger, NotFoundException, BadRequestException, ConflictException, Optional } from '@nestjs/common';
// BullMQ removed - requires Redis. Uncomment when Redis available:
// import { InjectQueue } from '@nestjs/bullmq';
// import { Queue } from 'bullmq';
import { BookingRepository } from '../repositories/booking.repository';
import { AvailabilityRepository } from '../repositories/availability.repository';
import { PricingService } from './pricing.service';
import { DistributedLockService } from '@infrastructure/cache/distributed-lock.service';
import { CreateBookingDto, RescheduleBookingDto, CancelBookingDto } from '../dto/booking.dto';
import { BookingResponseDto } from '../dto/booking-response.dto';
import { BookingStatus } from '@infrastructure/database/schemas/booking.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Banquet, BanquetDocument } from '@infrastructure/database/schemas/banquet.schema';

/**
 * Booking Service
 * Core business logic for booking management with concurrency control
 */
@Injectable()
export class BookingService {
    private readonly logger = new Logger(BookingService.name);
    private readonly bookingQueue: any = null; // BullMQ queue disabled

    constructor(
        private readonly bookingRepository: BookingRepository,
        private readonly availabilityRepository: AvailabilityRepository,
        private readonly pricingService: PricingService,
        private readonly lockService: DistributedLockService,
        @InjectModel(Banquet.name) private banquetModel: Model<BanquetDocument>,
        // BullMQ disabled - uncomment when Redis available:
        // @InjectQueue('booking-confirmation') private bookingQueue: Queue,
    ) { }

    /**
     * Create a new booking with concurrency control
     */
    async createBooking(
        customerId: string,
        createBookingDto: CreateBookingDto,
    ): Promise<BookingResponseDto> {
        const { banquetId, eventDate, guestCount, notes } = createBookingDto;

        // Validate future date
        if (new Date(eventDate) <= new Date()) {
            throw new BadRequestException('Event date must be in the future');
        }

        // Acquire distributed lock
        const lockKey = `booking:${banquetId}:${eventDate.toISOString().split('T')[0]}`;

        return await this.lockService.executeWithLock(lockKey, async () => {
            // Check if banquet exists
            const banquet = await this.banquetModel.findById(banquetId).exec();
            if (!banquet) {
                throw new NotFoundException('Banquet not found');
            }

            // Check capacity
            if (guestCount > banquet.capacity) {
                throw new BadRequestException(
                    `Guest count exceeds banquet capacity (${banquet.capacity})`
                );
            }

            // Check availability
            const isAvailable = await this.availabilityRepository.isDateAvailable(banquetId, eventDate);
            if (!isAvailable) {
                throw new ConflictException('Selected date is not available');
            }

            // Check for existing booking
            const isBooked = await this.bookingRepository.isDateBooked(banquetId, eventDate);
            if (isBooked) {
                throw new ConflictException('This date is already booked');
            }

            // Calculate pricing
            const pricingBreakdown = await this.pricingService.calculatePrice(
                banquetId,
                eventDate,
                guestCount,
                banquet.pricing?.perPlate,
            );

            // Generate booking reference
            const bookingReference = await this.bookingRepository.generateBookingReference();

            // Create booking
            const booking = await this.bookingRepository.create({
                banquetId,
                customerId,
                eventDate,
                guestCount,
                status: BookingStatus.PENDING,
                pricing: {
                    basePrice: pricingBreakdown.basePrice,
                    seasonalMultiplier: pricingBreakdown.seasonalMultiplier,
                    weekendMultiplier: pricingBreakdown.weekendMultiplier,
                    totalAmount: pricingBreakdown.totalAmount,
                    guestCount,
                },
                bookingReference,
                notes,
                createdBy: customerId,
            } as any);

            // Add audit entry
            booking.addAuditEntry('BOOKING_CREATED', customerId, 'Initial booking creation');
            await booking.save();

            // Mark date as unavailable
            await this.availabilityRepository.markDateUnavailable(
                banquetId,
                eventDate,
                `Booked - ${bookingReference}`,
            );

            // Queue async tasks
            await this.queueBookingConfirmation(booking);

            this.logger.log(`Booking created: ${bookingReference} for ${customerId}`);

            return this.mapToResponseDto(booking);
        });
    }

    /**
     * Confirm a booking
     */
    async confirmBooking(bookingId: string, userId: string): Promise<BookingResponseDto> {
        const booking = await this.bookingRepository.findById(bookingId);
        if (!booking) {
            throw new NotFoundException('Booking not found');
        }

        if (booking.status !== BookingStatus.PENDING) {
            throw new BadRequestException('Only pending bookings can be confirmed');
        }

        booking.status = BookingStatus.CONFIRMED;
        booking.addAuditEntry('BOOKING_CONFIRMED', userId, 'Booking confirmed by owner/admin');
        booking.updatedBy = userId as any;
        await booking.save();

        this.logger.log(`Booking confirmed: ${booking.bookingReference}`);

        return this.mapToResponseDto(booking);
    }

    /**
     * Cancel a booking
     */
    async cancelBooking(
        bookingId: string,
        userId: string,
        cancelDto: CancelBookingDto,
    ): Promise<BookingResponseDto> {
        const booking = await this.bookingRepository.findById(bookingId);
        if (!booking) {
            throw new NotFoundException('Booking not found');
        }

        if (!booking.canBeCancelled()) {
            throw new BadRequestException('This booking cannot be cancelled');
        }

        // Release availability
        await this.availabilityRepository.markDateAvailable(
            booking.banquetId.toHexString(),
            booking.eventDate,
        );

        booking.status = BookingStatus.CANCELLED;
        booking.addAuditEntry('BOOKING_CANCELLED', userId, cancelDto.reason || 'Booking cancelled');
        booking.updatedBy = userId as any;
        await booking.save();

        this.logger.log(`Booking cancelled: ${booking.bookingReference}`);

        return this.mapToResponseDto(booking);
    }

    /**
     * Reschedule a booking
     */
    async rescheduleBooking(
        bookingId: string,
        userId: string,
        rescheduleDto: RescheduleBookingDto,
    ): Promise<BookingResponseDto> {
        const { newEventDate, reason } = rescheduleDto;
        const booking = await this.bookingRepository.findById(bookingId);

        if (!booking) {
            throw new NotFoundException('Booking not found');
        }

        if (!booking.canBeRescheduled()) {
            throw new BadRequestException('This booking cannot be rescheduled');
        }

        const banquetId = booking.banquetId.toHexString();
        const oldEventDate = booking.eventDate;

        // Acquire locks for both dates
        const oldLockKey = `booking:${banquetId}:${oldEventDate.toISOString().split('T')[0]}`;
        const newLockKey = `booking:${banquetId}:${newEventDate.toISOString().split('T')[0]}`;

        return await this.lockService.executeWithLock(oldLockKey, async () => {
            return await this.lockService.executeWithLock(newLockKey, async () => {
                // Check new date availability
                const isAvailable = await this.availabilityRepository.isDateAvailable(banquetId, newEventDate);
                if (!isAvailable) {
                    throw new ConflictException('New date is not available');
                }

                const isBooked = await this.bookingRepository.isDateBooked(banquetId, newEventDate);
                if (isBooked) {
                    throw new ConflictException('New date is already booked');
                }

                // Release old date
                await this.availabilityRepository.markDateAvailable(banquetId, oldEventDate);

                // Book new date
                await this.availabilityRepository.markDateUnavailable(
                    banquetId,
                    newEventDate,
                    `Rescheduled - ${booking.bookingReference}`,
                );

                // Update booking
                booking.eventDate = newEventDate;
                booking.addAuditEntry(
                    'BOOKING_RESCHEDULED',
                    userId,
                    reason || `Rescheduled from ${oldEventDate.toISOString().split('T')[0]}`,
                );
                booking.updatedBy = userId as any;
                await booking.save();

                this.logger.log(`Booking rescheduled: ${booking.bookingReference}`);

                return this.mapToResponseDto(booking);
            });
        });
    }

    /**
     * Get customer bookings
     */
    async getCustomerBookings(customerId: string, status?: BookingStatus): Promise<BookingResponseDto[]> {
        const bookings = await this.bookingRepository.findByCustomer(customerId, status);
        return bookings.map(b => this.mapToResponseDto(b));
    }

    /**
     * Get booking by ID
     */
    async getBookingById(bookingId: string): Promise<BookingResponseDto> {
        const booking = await this.bookingRepository.findById(bookingId);
        if (!booking) {
            throw new NotFoundException('Booking not found');
        }
        return this.mapToResponseDto(booking);
    }

    /**
     * Queue booking confirmation job
     */
    private async queueBookingConfirmation(booking: any): Promise<void> {
        // Skip queueing if Redis/BullMQ not available
        if (!this.bookingQueue) {
            this.logger.warn('BullMQ not available - skipping booking confirmation queue');
            return;
        }

        try {
            await this.bookingQueue.add(
                'send-confirmation',
                {
                    bookingId: booking._id.toHexString(),
                    customerId: booking.customerId.toHexString(),
                    banquetId: booking.banquetId.toHexString(),
                    eventDate: booking.eventDate,
                    bookingReference: booking.bookingReference,
                },
                {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 5000,
                    },
                },
            );
        } catch (error: any) {
            this.logger.error(`Failed to queue booking confirmation: ${error.message}`);
        }
    }

    /**
     * Map to response DTO
     */
    private mapToResponseDto(booking: any): BookingResponseDto {
        return {
            id: booking._id.toHexString(),
            banquetId: booking.banquetId.toHexString(),
            customerId: booking.customerId.toHexString(),
            eventDate: booking.eventDate,
            guestCount: booking.guestCount,
            status: booking.status,
            pricing: booking.pricing,
            paymentStatus: booking.paymentStatus,
            bookingReference: booking.bookingReference,
            notes: booking.notes,
            createdAt: booking.createdAt,
            updatedAt: booking.updatedAt,
        };
    }
}
