import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BookingDocument = Booking & Document & {
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    createdBy: string | null;
    updatedBy: string | null;
    addAuditEntry(action: string, userId?: Types.ObjectId | string, notes?: string): void;
    canBeCancelled(): boolean;
    canBeRescheduled(): boolean;
};

export enum BookingStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    CANCELLED = 'CANCELLED',
    COMPLETED = 'COMPLETED',
    REFUNDED = 'REFUNDED',
}

export enum PaymentStatus {
    PENDING = 'PENDING',
    PAID = 'PAID',
    REFUNDED = 'REFUNDED',
    FAILED = 'FAILED',
}

/**
 * Booking Pricing Details
 */
@Schema({ _id: false })
export class BookingPricing {
    @Prop({ type: Number, required: true })
    basePrice: number;

    @Prop({ type: Number, default: 1.0 })
    seasonalMultiplier: number;

    @Prop({ type: Number, default: 1.0 })
    weekendMultiplier: number;

    @Prop({ type: Number, required: true })
    totalAmount: number;

    @Prop({ type: Number, required: true })
    guestCount: number;
}

/**
 * Booking Audit Trail Entry
 */
@Schema({ _id: false })
export class BookingAuditEntry {
    @Prop({ type: String, required: true })
    action: string;

    @Prop({ type: Date, default: Date.now })
    timestamp: Date;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    userId?: Types.ObjectId;

    @Prop({ type: String })
    notes?: string;
}

/**
 * Booking Schema
 * Manages banquet bookings with lifecycle and audit trail
 */
@Schema({ timestamps: true, collection: 'bookings' })
export class Booking {
    @Prop({ type: Types.ObjectId, ref: 'Banquet', required: true, index: true })
    banquetId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    customerId: Types.ObjectId;

    @Prop({ type: Date, required: true, index: true })
    eventDate: Date;

    @Prop({ type: Number, required: true, min: 1 })
    guestCount: number;

    @Prop({ type: String, enum: BookingStatus, default: BookingStatus.PENDING, index: true })
    status: BookingStatus;

    @Prop({ type: BookingPricing, required: true })
    pricing: BookingPricing;

    @Prop({ type: String, enum: PaymentStatus, default: PaymentStatus.PENDING })
    paymentStatus: PaymentStatus;

    @Prop({ type: String, unique: true, index: true })
    bookingReference: string;

    @Prop({ type: String })
    notes?: string;

    @Prop({ type: Object })
    metadata?: Record<string, any>;

    @Prop({ type: [BookingAuditEntry], default: [] })
    auditTrail: BookingAuditEntry[];

    @Prop({ type: Date, default: null })
    deletedAt: Date | null;

    @Prop({ type: String, default: null })
    createdBy: string | null;

    @Prop({ type: String, default: null })
    updatedBy: string | null;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);

// ==================================
// INDEXES FOR BOOKING QUERIES
// ==================================

// Compound index for availability checking
BookingSchema.index({ banquetId: 1, eventDate: 1, status: 1 });

// Customer bookings query
BookingSchema.index({ customerId: 1, status: 1, eventDate: -1 });

// Payment tracking
BookingSchema.index({ paymentStatus: 1, createdAt: -1 });

// Active bookings (not deleted)
BookingSchema.index({ deletedAt: 1 });

// ==================================
// METHODS
// ==================================

BookingSchema.methods.addAuditEntry = function (action: string, userId?: Types.ObjectId, notes?: string) {
    this.auditTrail.push({
        action,
        userId,
        notes,
        timestamp: new Date(),
    });
};

BookingSchema.methods.canBeCancelled = function (): boolean {
    return [BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(this.status);
};

BookingSchema.methods.canBeRescheduled = function (): boolean {
    return [BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(this.status);
};
