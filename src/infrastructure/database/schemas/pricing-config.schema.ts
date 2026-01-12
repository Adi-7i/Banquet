import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PricingConfigDocument = PricingConfig & Document;

/**
 * Seasonal Pricing Rate
 */
@Schema({ _id: false })
export class SeasonalRate {
    @Prop({ type: Date, required: true })
    startDate: Date;

    @Prop({ type: Date, required: true })
    endDate: Date;

    @Prop({ type: Number, required: true, min: 0.1 })
    multiplier: number;

    @Prop({ type: String })
    seasonName?: string;
}

/**
 * Pricing Configuration Schema
 * Manages dynamic pricing for banquets
 */
@Schema({ timestamps: true, collection: 'pricing_configs' })
export class PricingConfig {
    @Prop({ type: Types.ObjectId, ref: 'Banquet', required: true, unique: true, index: true })
    banquetId: Types.ObjectId;

    @Prop({ type: Number, required: true, min: 0 })
    basePrice: number;

    @Prop({ type: [SeasonalRate], default: [] })
    seasonalRates: SeasonalRate[];

    @Prop({ type: Number, default: 1.0, min: 0.1 })
    weekendMultiplier: number;

    @Prop({ type: Number, default: 1.0, min: 0.1 })
    peakHoursMultiplier: number;

    @Prop({ type: Boolean, default: true })
    isActive: boolean;

    @Prop({ type: Date, default: null })
    deletedAt?: Date;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    createdBy?: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    updatedBy?: Types.ObjectId;
}

export const PricingConfigSchema = SchemaFactory.createForClass(PricingConfig);

// ==================================
// INDEXES
// ==================================

PricingConfigSchema.index({ banquetId: 1, isActive: 1 });
