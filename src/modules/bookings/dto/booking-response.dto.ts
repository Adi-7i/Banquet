import { ApiProperty } from '@nestjs/swagger';

/**
 * Booking Response DTO
 */
export class BookingResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    banquetId: string;

    @ApiProperty()
    customerId: string;

    @ApiProperty()
    eventDate: Date;

    @ApiProperty()
    guestCount: number;

    @ApiProperty()
    status: string;

    @ApiProperty()
    pricing: {
        basePrice: number;
        seasonalMultiplier: number;
        weekendMultiplier: number;
        totalAmount: number;
        guestCount: number;
    };

    @ApiProperty()
    paymentStatus: string;

    @ApiProperty()
    bookingReference: string;

    @ApiProperty({ required: false })
    notes?: string;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}

/**
 * Booking Pricing Breakdown DTO
 */
export class PricingBreakdownDto {
    @ApiProperty()
    basePrice: number;

    @ApiProperty()
    guestCount: number;

    @ApiProperty()
    seasonalMultiplier: number;

    @ApiProperty()
    weekendMultiplier: number;

    @ApiProperty()
    subtotal: number;

    @ApiProperty()
    totalAmount: number;

    @ApiProperty({ required: false })
    seasonName?: string;
}
