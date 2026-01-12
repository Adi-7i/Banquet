/**
 * Banquet status
 */
export enum BanquetStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    UNDER_MAINTENANCE = 'UNDER_MAINTENANCE',
}

/**
 * Banquet amenity
 */
export interface BanquetAmenity {
    name: string;
    description?: string;
    included: boolean;
}

/**
 * Pricing structure
 */
export interface BanquetPricing {
    basePrice: number;
    pricePerPerson?: number;
    minimumSpend?: number;
    currency: string;
}

/**
 * Banquet domain entity props
 */
export interface BanquetProps {
    id: string;
    ownerId: string;
    name: string;
    description?: string;
    address: string;
    city: string;
    state?: string;
    country: string;
    zipCode?: string;
    capacity: {
        minimum: number;
        maximum: number;
    };
    pricing: BanquetPricing;
    amenities?: BanquetAmenity[];
    images?: string[];
    status: BanquetStatus;
    rating?: number;
    totalReviews?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * Banquet Domain Entity
 * Contains core business rules for banquet management
 */
export class Banquet {
    private readonly props: BanquetProps;

    private constructor(props: BanquetProps) {
        this.props = props;
    }

    /**
     * Create a new Banquet entity
     */
    static create(props: BanquetProps): Banquet {
        // Validate capacity
        if (props.capacity.minimum > props.capacity.maximum) {
            throw new Error('Minimum capacity cannot exceed maximum capacity');
        }
        if (props.capacity.minimum < 1) {
            throw new Error('Minimum capacity must be at least 1');
        }

        // Validate pricing
        if (props.pricing.basePrice < 0) {
            throw new Error('Base price cannot be negative');
        }

        return new Banquet(props);
    }

    /**
     * Reconstitute Banquet from persistence
     */
    static fromPersistence(data: BanquetProps): Banquet {
        return new Banquet(data);
    }

    // ============ Getters ============

    get id(): string {
        return this.props.id;
    }

    get ownerId(): string {
        return this.props.ownerId;
    }

    get name(): string {
        return this.props.name;
    }

    get description(): string | undefined {
        return this.props.description;
    }

    get address(): string {
        return this.props.address;
    }

    get city(): string {
        return this.props.city;
    }

    get capacity(): { minimum: number; maximum: number } {
        return { ...this.props.capacity };
    }

    get pricing(): BanquetPricing {
        return { ...this.props.pricing };
    }

    get status(): BanquetStatus {
        return this.props.status;
    }

    get rating(): number {
        return this.props.rating || 0;
    }

    // ============ Business Rules ============

    /**
     * Check if banquet is available for booking
     */
    isAvailable(): boolean {
        return this.props.status === BanquetStatus.ACTIVE;
    }

    /**
     * Check if guest count is within capacity
     */
    canAccommodateGuests(guestCount: number): boolean {
        return guestCount >= this.props.capacity.minimum &&
            guestCount <= this.props.capacity.maximum;
    }

    /**
     * Calculate total price for a booking
     */
    calculatePrice(guestCount: number, additionalCharges: number = 0): number {
        let total = this.props.pricing.basePrice;

        if (this.props.pricing.pricePerPerson) {
            total += this.props.pricing.pricePerPerson * guestCount;
        }

        total += additionalCharges;

        // Apply minimum spend if applicable
        if (this.props.pricing.minimumSpend && total < this.props.pricing.minimumSpend) {
            total = this.props.pricing.minimumSpend;
        }

        return total;
    }

    /**
     * Check if a user can manage this banquet
     */
    canBeManageBy(userId: string): boolean {
        return this.props.ownerId === userId;
    }

    /**
     * Check capacity constraints for validation
     */
    validateCapacity(guestCount: number): {
        valid: boolean;
        error?: string;
    } {
        if (guestCount < this.props.capacity.minimum) {
            return {
                valid: false,
                error: `Minimum guest count is ${this.props.capacity.minimum}`,
            };
        }
        if (guestCount > this.props.capacity.maximum) {
            return {
                valid: false,
                error: `Maximum guest count is ${this.props.capacity.maximum}`,
            };
        }
        return { valid: true };
    }

    /**
     * Check if banquet has a specific amenity
     */
    hasAmenity(amenityName: string): boolean {
        return this.props.amenities?.some(
            a => a.name.toLowerCase() === amenityName.toLowerCase() && a.included
        ) || false;
    }

    /**
     * Get included amenities
     */
    getIncludedAmenities(): BanquetAmenity[] {
        return this.props.amenities?.filter(a => a.included) || [];
    }

    /**
     * Convert to plain object for persistence
     */
    toPersistence(): Record<string, any> {
        return {
            ownerId: this.props.ownerId,
            name: this.props.name,
            description: this.props.description,
            address: this.props.address,
            city: this.props.city,
            state: this.props.state,
            country: this.props.country,
            zipCode: this.props.zipCode,
            capacity: this.props.capacity,
            pricing: this.props.pricing,
            amenities: this.props.amenities,
            images: this.props.images,
            status: this.props.status,
        };
    }
}
