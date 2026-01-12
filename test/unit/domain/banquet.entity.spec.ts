import { Banquet, BanquetStatus } from '../../../src/domain/entities/banquet.entity';

describe('Banquet Entity', () => {
    const createTestBanquet = (overrides: Partial<{
        status: BanquetStatus;
        minCapacity: number;
        maxCapacity: number;
        basePrice: number;
        pricePerPerson: number;
        minimumSpend: number;
    }> = {}) => {
        return Banquet.create({
            id: 'banquet-123',
            ownerId: 'owner-456',
            name: 'Test Banquet Hall',
            description: 'A beautiful venue',
            address: '123 Main St',
            city: 'Mumbai',
            country: 'India',
            capacity: {
                minimum: overrides.minCapacity ?? 50,
                maximum: overrides.maxCapacity ?? 500,
            },
            pricing: {
                basePrice: overrides.basePrice ?? 10000,
                pricePerPerson: overrides.pricePerPerson ?? 500,
                minimumSpend: overrides.minimumSpend,
                currency: 'INR',
            },
            status: overrides.status ?? BanquetStatus.ACTIVE,
        });
    };

    describe('create', () => {
        it('should create a valid banquet', () => {
            const banquet = createTestBanquet();
            expect(banquet.id).toBe('banquet-123');
            expect(banquet.name).toBe('Test Banquet Hall');
        });

        it('should throw error if minimum capacity exceeds maximum', () => {
            expect(() => createTestBanquet({
                minCapacity: 100,
                maxCapacity: 50,
            })).toThrow('Minimum capacity cannot exceed maximum capacity');
        });

        it('should throw error if minimum capacity is less than 1', () => {
            expect(() => createTestBanquet({
                minCapacity: 0,
            })).toThrow('Minimum capacity must be at least 1');
        });

        it('should throw error if base price is negative', () => {
            expect(() => createTestBanquet({
                basePrice: -100,
            })).toThrow('Base price cannot be negative');
        });
    });

    describe('isAvailable', () => {
        it('should return true for active banquet', () => {
            const banquet = createTestBanquet({ status: BanquetStatus.ACTIVE });
            expect(banquet.isAvailable()).toBe(true);
        });

        it('should return false for inactive banquet', () => {
            const banquet = createTestBanquet({ status: BanquetStatus.INACTIVE });
            expect(banquet.isAvailable()).toBe(false);
        });

        it('should return false for banquet under maintenance', () => {
            const banquet = createTestBanquet({ status: BanquetStatus.UNDER_MAINTENANCE });
            expect(banquet.isAvailable()).toBe(false);
        });
    });

    describe('canAccommodateGuests', () => {
        it('should return true for valid guest count', () => {
            const banquet = createTestBanquet({ minCapacity: 50, maxCapacity: 200 });
            expect(banquet.canAccommodateGuests(100)).toBe(true);
            expect(banquet.canAccommodateGuests(50)).toBe(true);
            expect(banquet.canAccommodateGuests(200)).toBe(true);
        });

        it('should return false for guest count below minimum', () => {
            const banquet = createTestBanquet({ minCapacity: 50, maxCapacity: 200 });
            expect(banquet.canAccommodateGuests(49)).toBe(false);
        });

        it('should return false for guest count above maximum', () => {
            const banquet = createTestBanquet({ minCapacity: 50, maxCapacity: 200 });
            expect(banquet.canAccommodateGuests(201)).toBe(false);
        });
    });

    describe('validateCapacity', () => {
        it('should return valid for acceptable guest count', () => {
            const banquet = createTestBanquet({ minCapacity: 50, maxCapacity: 200 });
            const result = banquet.validateCapacity(100);
            expect(result.valid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it('should return error for below minimum', () => {
            const banquet = createTestBanquet({ minCapacity: 50, maxCapacity: 200 });
            const result = banquet.validateCapacity(30);
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Minimum guest count is 50');
        });

        it('should return error for above maximum', () => {
            const banquet = createTestBanquet({ minCapacity: 50, maxCapacity: 200 });
            const result = banquet.validateCapacity(250);
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Maximum guest count is 200');
        });
    });

    describe('calculatePrice', () => {
        it('should calculate base price plus per person cost', () => {
            const banquet = createTestBanquet({
                basePrice: 10000,
                pricePerPerson: 500,
            });
            // 10000 + (100 * 500) = 60000
            expect(banquet.calculatePrice(100)).toBe(60000);
        });

        it('should include additional charges', () => {
            const banquet = createTestBanquet({
                basePrice: 10000,
                pricePerPerson: 500,
            });
            // 10000 + (100 * 500) + 5000 = 65000
            expect(banquet.calculatePrice(100, 5000)).toBe(65000);
        });

        it('should apply minimum spend if total is below', () => {
            const banquet = createTestBanquet({
                basePrice: 1000,
                pricePerPerson: 100,
                minimumSpend: 50000,
            });
            // Base calculation: 1000 + (10 * 100) = 2000, but minimum is 50000
            expect(banquet.calculatePrice(10)).toBe(50000);
        });

        it('should not apply minimum spend if total exceeds it', () => {
            const banquet = createTestBanquet({
                basePrice: 10000,
                pricePerPerson: 500,
                minimumSpend: 20000,
            });
            // 10000 + (100 * 500) = 60000 > 20000 minimum
            expect(banquet.calculatePrice(100)).toBe(60000);
        });
    });

    describe('canBeManageBy', () => {
        it('should return true for owner', () => {
            const banquet = createTestBanquet();
            expect(banquet.canBeManageBy('owner-456')).toBe(true);
        });

        it('should return false for non-owner', () => {
            const banquet = createTestBanquet();
            expect(banquet.canBeManageBy('other-owner')).toBe(false);
        });
    });

    describe('amenities', () => {
        it('should check if amenity exists', () => {
            const banquet = Banquet.create({
                id: 'banquet-1',
                ownerId: 'owner-1',
                name: 'Hall',
                address: 'Address',
                city: 'City',
                country: 'Country',
                capacity: { minimum: 10, maximum: 100 },
                pricing: { basePrice: 1000, currency: 'INR' },
                status: BanquetStatus.ACTIVE,
                amenities: [
                    { name: 'WiFi', included: true },
                    { name: 'Parking', included: true },
                    { name: 'Catering', included: false },
                ],
            });

            expect(banquet.hasAmenity('WiFi')).toBe(true);
            expect(banquet.hasAmenity('wifi')).toBe(true); // case insensitive
            expect(banquet.hasAmenity('Catering')).toBe(false); // not included
            expect(banquet.hasAmenity('Pool')).toBe(false); // doesn't exist
        });

        it('should get included amenities', () => {
            const banquet = Banquet.create({
                id: 'banquet-1',
                ownerId: 'owner-1',
                name: 'Hall',
                address: 'Address',
                city: 'City',
                country: 'Country',
                capacity: { minimum: 10, maximum: 100 },
                pricing: { basePrice: 1000, currency: 'INR' },
                status: BanquetStatus.ACTIVE,
                amenities: [
                    { name: 'WiFi', included: true },
                    { name: 'Parking', included: true },
                    { name: 'Catering', included: false },
                ],
            });

            const included = banquet.getIncludedAmenities();
            expect(included).toHaveLength(2);
            expect(included.map(a => a.name)).toContain('WiFi');
            expect(included.map(a => a.name)).toContain('Parking');
        });
    });
});
