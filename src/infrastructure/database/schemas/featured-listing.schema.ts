import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FeaturedListingDocument = FeaturedListing & Document & {
    createdAt: Date;
    updatedAt: Date;
};

/**
 * Featured Listing Status
 */
export enum FeaturedStatus {
    SCHEDULED = 'SCHEDULED',
    ACTIVE = 'ACTIVE',
    EXPIRED = 'EXPIRED',
    CANCELLED = 'CANCELLED',
}

/**
 * Featured Listing Schema
 * Manages promoted banquet listings
 */
@Schema({ timestamps: true, collection: 'featured_listings' })
export class FeaturedListing {
    @Prop({ type: Types.ObjectId, ref: 'Banquet', required: true, index: true })
    banquetId: Types.ObjectId;

    @Prop({ type: Date, required: true })
    startDate: Date;

    @Prop({ type: Date, required: true })
    endDate: Date;

    @Prop({ type: Number, min: 1, max: 100, default: 50 })
    position: number;

    @Prop({ type: Number, min: 0, default: 0 })
    fee: number;

    @Prop({ type: String, enum: FeaturedStatus, default: FeaturedStatus.SCHEDULED })
    status: FeaturedStatus;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    approvedBy: Types.ObjectId;

    @Prop({ type: String })
    notes?: string;
}

export const FeaturedListingSchema = SchemaFactory.createForClass(FeaturedListing);

// ==================================
// INDEXES
// ==================================

FeaturedListingSchema.index({ status: 1, startDate: 1, endDate: 1 });
FeaturedListingSchema.index({ banquetId: 1, status: 1 });
FeaturedListingSchema.index({ position: 1, status: 1 });
