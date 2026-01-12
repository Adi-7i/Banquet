import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PricingConfig, PricingConfigDocument } from '@infrastructure/database/schemas/pricing-config.schema';
import { PricingBreakdownDto } from '../dto/booking-response.dto';

/**
 * Pricing Service
 * Calculates dynamic pricing based on date, guest count, and configuration
 */
@Injectable()
export class PricingService {
    private readonly logger = new Logger(PricingService.name);

    constructor(
        @InjectModel(PricingConfig.name)
        private pricingConfigModel: Model<PricingConfigDocument>,
    ) { }

    /**
     * Calculate price for a booking
     */
    async calculatePrice(
        banquetId: string,
        eventDate: Date,
        guestCount: number,
        basePrice?: number,
    ): Promise<PricingBreakdownDto> {
        // Get pricing config for banquet (or use base price from banquet)
        const config = await this.pricingConfigModel.findOne({
            banquetId: new Types.ObjectId(banquetId),
            isActive: true,
            deletedAt: null,
        }).exec();

        const pricePerPlate = config?.basePrice || basePrice || 0;

        // Calculate multipliers
        const seasonalMultiplier = this.getSeasonalMultiplier(eventDate, config);
        const weekendMultiplier = this.getWeekendMultiplier(eventDate, config);

        // Calculate total
        const subtotal = pricePerPlate * guestCount;
        const totalAmount = subtotal * seasonalMultiplier * weekendMultiplier;

        this.logger.debug(
            `Pricing calculated - Base: ${pricePerPlate}, Guests: ${guestCount}, ` +
            `Seasonal: ${seasonalMultiplier}, Weekend: ${weekendMultiplier}, Total: ${totalAmount}`
        );

        return {
            basePrice: pricePerPlate,
            guestCount,
            seasonalMultiplier,
            weekendMultiplier,
            subtotal,
            totalAmount: Math.round(totalAmount * 100) / 100, // Round to 2 decimals
            seasonName: this.getSeasonName(eventDate, config),
        };
    }

    /**
     * Get seasonal multiplier for a date
     */
    private getSeasonalMultiplier(
        eventDate: Date,
        config: PricingConfigDocument | null,
    ): number {
        if (!config || !config.seasonalRates || config.seasonalRates.length === 0) {
            return 1.0;
        }

        // Find matching seasonal rate
        const seasonalRate = config.seasonalRates.find(rate => {
            const rateStart = new Date(rate.startDate);
            const rateEnd = new Date(rate.endDate);
            return eventDate >= rateStart && eventDate <= rateEnd;
        });

        return seasonalRate?.multiplier || 1.0;
    }

    /**
     * Get season name for a date
     */
    private getSeasonName(
        eventDate: Date,
        config: PricingConfigDocument | null,
    ): string | undefined {
        if (!config || !config.seasonalRates) {
            return undefined;
        }

        const seasonalRate = config.seasonalRates.find(rate => {
            const rateStart = new Date(rate.startDate);
            const rateEnd = new Date(rate.endDate);
            return eventDate >= rateStart && eventDate <= rateEnd;
        });

        return seasonalRate?.seasonName;
    }

    /**
     * Get weekend multiplier (Saturday/Sunday)
     */
    private getWeekendMultiplier(
        eventDate: Date,
        config: PricingConfigDocument | null,
    ): number {
        const dayOfWeek = eventDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday

        if (isWeekend && config?.weekendMultiplier) {
            return config.weekendMultiplier;
        }

        return 1.0;
    }

    /**
     * Create or update pricing configuration
     */
    async upsertPricingConfig(
        banquetId: string,
        config: Partial<PricingConfig>,
    ): Promise<PricingConfigDocument> {
        return this.pricingConfigModel.findOneAndUpdate(
            { banquetId: new Types.ObjectId(banquetId) },
            { $set: { ...config, updatedAt: new Date() } },
            { upsert: true, new: true },
        ).exec();
    }
}
