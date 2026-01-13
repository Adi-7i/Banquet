import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { softDeletePlugin, auditFieldsPlugin, SoftDeleteDocument } from './base.schema';

// ============================================
// ENUMS
// ============================================

export enum BanquetStatus {
    DRAFT = 'DRAFT',
    PENDING = 'PENDING',
    PUBLISHED = 'PUBLISHED',
    REJECTED = 'REJECTED',
    UNAVAILABLE = 'UNAVAILABLE',
    DELETED = 'DELETED',
}

// ============================================
// BANQUET SCHEMA
// ============================================

@Schema({
    timestamps: true,
    collection: 'banquets',
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
})
export class Banquet {
    _id: Types.ObjectId;

    @Prop({ required: true })
    name: string;

    @Prop()
    description: string;

    // Location
    @Prop({ required: true })
    address: string;

    @Prop({ required: true, index: true })
    city: string;

    @Prop({ required: true })
    state: string;

    @Prop({ required: true })
    pincode: string;

    @Prop()
    latitude: number;

    @Prop()
    longitude: number;

    // Capacity and pricing
    @Prop({ required: true })
    capacity: number;

    @Prop({ type: Object, required: true })
    pricing: Record<string, any>;

    // Features and amenities
    @Prop({ type: Object })
    amenities: Record<string, any>;

    @Prop({ type: [String], default: [] })
    images: string[];

    // Status
    @Prop({ enum: BanquetStatus, type: String, default: BanquetStatus.DRAFT, index: true })
    status: BanquetStatus;

    // Owner reference
    @Prop({ type: Types.ObjectId, ref: 'OwnerProfile', required: true, index: true })
    ownerId: Types.ObjectId;

    // Audit fields
    @Prop({ type: Date, default: null, index: true })
    deletedAt: Date | null;

    @Prop({ type: String, default: null })
    createdBy: string | null;

    @Prop({ type: String, default: null })
    updatedBy: string | null;

    createdAt: Date;
    updatedAt: Date;
}

export type BanquetDocument = Banquet & Document & SoftDeleteDocument;
export const BanquetSchema = SchemaFactory.createForClass(Banquet);

BanquetSchema.plugin(softDeletePlugin);
BanquetSchema.plugin(auditFieldsPlugin);

BanquetSchema.virtual('id').get(function (this: BanquetDocument) {
    return this._id.toHexString();
});

// Virtual populate for owner
BanquetSchema.virtual('owner', {
    ref: 'OwnerProfile',
    localField: 'ownerId',
    foreignField: '_id',
    justOne: true,
});

// ==================================
// INDEXES FOR SEARCH OPTIMIZATION
// ==================================

// Text index for name and description (full-text search)
BanquetSchema.index({ name: 'text', description: 'text' });

// Compound indexes for common queries
BanquetSchema.index({ city: 1, status: 1 }); // Filter by city and status
BanquetSchema.index({ ownerId: 1, status: 1 }); // Owner's banquets by status
BanquetSchema.index({ capacity: 1 }); // Filter by capacity
BanquetSchema.index({ status: 1, createdAt: -1 }); // Active banquets sorted by date

// Price index for sorting/filtering
BanquetSchema.index({ 'pricing.perPlate': 1, status: 1 });

// Geospatial index for location-based search
// Note: This requires GeoJSON format
BanquetSchema.index({ location: '2dsphere' });

// Fallback: Simple lat/lng indexes for distance calculations
BanquetSchema.index({ latitude: 1, longitude: 1 });

