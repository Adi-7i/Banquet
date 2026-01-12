import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

/**
 * Create Booking DTO
 */
export class CreateBookingDto {
    @ApiProperty({ description: 'Banquet ID', example: '507f1f77bcf86cd799439011' })
    @IsNotEmpty()
    @IsString()
    banquetId: string;

    @ApiProperty({ description: 'Event date (must be future)', example: '2024-12-25' })
    @IsNotEmpty()
    @Type(() => Date)
    @IsDate()
    eventDate: Date;

    @ApiProperty({ description: 'Number of guests', example: 150, minimum: 1 })
    @IsNotEmpty()
    @IsNumber()
    @Min(1)
    guestCount: number;

    @ApiPropertyOptional({ description: 'Additional notes' })
    @IsOptional()
    @IsString()
    notes?: string;
}

/**
 * Update Booking DTO
 */
export class UpdateBookingDto {
    @ApiPropertyOptional({ description: 'New guest count' })
    @IsOptional()
    @IsNumber()
    @Min(1)
    guestCount?: number;

    @ApiPropertyOptional({ description: 'Updated notes' })
    @IsOptional()
    @IsString()
    notes?: string;
}

/**
 * Reschedule Booking DTO
 */
export class RescheduleBookingDto {
    @ApiProperty({ description: 'New event date', example: '2025-01-15' })
    @IsNotEmpty()
    @Type(() => Date)
    @IsDate()
    newEventDate: Date;

    @ApiPropertyOptional({ description: 'Reason for rescheduling' })
    @IsOptional()
    @IsString()
    reason?: string;
}

/**
 * Cancel Booking DTO
 */
export class CancelBookingDto {
    @ApiPropertyOptional({ description: 'Cancellation reason' })
    @IsOptional()
    @IsString()
    reason?: string;
}
