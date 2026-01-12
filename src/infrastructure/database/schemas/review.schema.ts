import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReviewDocument = Review & Document & {
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    createdBy: string | null;
    updatedBy: string | null;
    addAuditEntry(action: string, userId?: string, notes?: string): void;
};

export enum ModerationStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

/**
 * Review Photo
 */
@Schema({ _id: false })
export class ReviewPhoto {
    @Prop({ type: String, required: true })
    url: string;

    @Prop({ type: String })
    caption?: string;
}

/**
 * Owner Reply
 */
@Schema({ _id: false })
export class OwnerReply {
    @Prop({ type: String, required: true })
    content: string;

    @Prop({ type: Date, default: Date.now })
    repliedAt: Date;

    @Prop({ type: String })
    repliedBy: string;
}

/**
 * Edit History Entry
 */
@Schema({ _id: false })
export class EditHistoryEntry {
    @Prop({ type: String, required: true })
    previousContent: string;

    @Prop({ type: Number })
    previousRating: number;

    @Prop({ type: Date, default: Date.now })
    editedAt: Date;
}

/**
 * Review Audit Entry
 */
@Schema({ _id: false })
export class ReviewAuditEntry {
    @Prop({ type: String, required: true })
    action: string;

    @Prop({ type: Date, default: Date.now })
    timestamp: Date;

    @Prop({ type: String })
    userId?: string;

    @Prop({ type: String })
    notes?: string;
}

/**
 * Review Schema
 * Manages customer reviews with moderation and owner replies
 */
@Schema({ timestamps: true, collection: 'reviews' })
export class Review {
    @Prop({ type: Types.ObjectId, ref: 'Banquet', required: true, index: true })
    banquetId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    customerId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Booking', required: true })
    bookingId: Types.ObjectId;

    @Prop({ type: Number, required: true, min: 1, max: 5 })
    rating: number;

    @Prop({ type: String, maxlength: 100 })
    title?: string;

    @Prop({ type: String, required: true, maxlength: 2000 })
    content: string;

    @Prop({ type: [ReviewPhoto], default: [] })
    photos: ReviewPhoto[];

    @Prop({ type: String, enum: ModerationStatus, default: ModerationStatus.PENDING, index: true })
    moderationStatus: ModerationStatus;

    @Prop({ type: String })
    moderationNote?: string;

    @Prop({ type: String })
    moderatedBy?: string;

    @Prop({ type: Date })
    moderatedAt?: Date;

    @Prop({ type: OwnerReply })
    ownerReply?: OwnerReply;

    @Prop({ type: Boolean, default: false })
    isEdited: boolean;

    @Prop({ type: [EditHistoryEntry], default: [] })
    editHistory: EditHistoryEntry[];

    // Future AI integration fields
    @Prop({ type: Number, default: 0 })
    spamScore: number;

    @Prop({ type: Number })
    sentimentScore?: number;

    @Prop({ type: [ReviewAuditEntry], default: [] })
    auditTrail: ReviewAuditEntry[];

    @Prop({ type: Date, default: null })
    deletedAt: Date | null;

    @Prop({ type: String, default: null })
    createdBy: string | null;

    @Prop({ type: String, default: null })
    updatedBy: string | null;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

// ==================================
// INDEXES
// ==================================

// Unique constraint: one review per customer per banquet
ReviewSchema.index({ banquetId: 1, customerId: 1 }, { unique: true });

// Query approved reviews for banquet
ReviewSchema.index({ banquetId: 1, moderationStatus: 1, rating: -1 });

// Moderation queue
ReviewSchema.index({ moderationStatus: 1, createdAt: -1 });

// Customer's reviews
ReviewSchema.index({ customerId: 1, createdAt: -1 });

// Soft delete
ReviewSchema.index({ deletedAt: 1 });

// ==================================
// METHODS
// ==================================

ReviewSchema.methods.addAuditEntry = function(action: string, userId?: string, notes?: string) {
    this.auditTrail.push({
        action,
        userId,
        notes,
        timestamp: new Date(),
    });
};
