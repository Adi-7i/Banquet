import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AvailabilityDocument = Availability & Document & {
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    createdBy: string | null;
    updatedBy: string | null;
};

/**
 * Time Slot for slot-based booking
 */
@Schema({ _id: false })
export class TimeSlot {
    @Prop({ type: String, required: true })
    startTime: string; // Format: HH:mm

    @Prop({ type: String, required: true })
    endTime: string; // Format: HH:mm

    @Prop({ type: Boolean, default: false })
    isBooked: boolean;

    @Prop({ type: Types.ObjectId, ref: 'Booking' })
    bookingId?: Types.ObjectId;
}

/**
 * Availability Schema
 * Manages date-wise and slot-wise availability for banquets
 */
@Schema({ timestamps: true, collection: 'availability' })
export class Availability {
    @Prop({ type: Types.ObjectId, ref: 'Banquet', required: true, index: true })
    banquetId: Types.ObjectId;

    @Prop({ type: Date, required: true, index: true })
    date: Date;

    @Prop({ type: Boolean, default: true })
    isAvailable: boolean;

    @Prop({ type: [TimeSlot], default: [] })
    slots: TimeSlot[];

    @Prop({ type: String })
    blackoutReason?: string;

    @Prop({ type: Date, default: null })
    deletedAt: Date | null;

    @Prop({ type: String, default: null })
    createdBy: string | null;

    @Prop({ type: String, default: null })
    updatedBy: string | null;
}

export const AvailabilitySchema = SchemaFactory.createForClass(Availability);

// ==================================
// INDEXES FOR AVAILABILITY QUERIES
// ==================================

// Unique constraint: one availability record per banquet per date
AvailabilitySchema.index({ banquetId: 1, date: 1 }, { unique: true });

// Query available dates
AvailabilitySchema.index({ banquetId: 1, isAvailable: 1, date: 1 });

// Blackout dates query
AvailabilitySchema.index({ banquetId: 1, blackoutReason: 1 });
