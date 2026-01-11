import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BanquetStatus } from '@infrastructure/database/schemas/banquet.schema';

/**
 * Banquet response DTO
 */
export class BanquetResponseDto {
    @ApiProperty({ description: 'Banquet ID' })
    id: string;

    @ApiProperty({ description: 'Banquet name' })
    name: string;

    @ApiPropertyOptional({ description: 'Description' })
    description?: string;

    @ApiProperty({ description: 'Address' })
    address: string;

    @ApiProperty({ description: 'City' })
    city: string;

    @ApiProperty({ description: 'State' })
    state: string;

    @ApiProperty({ description: 'Pincode' })
    pincode: string;

    @ApiPropertyOptional({ description: 'Latitude' })
    latitude?: number;

    @ApiPropertyOptional({ description: 'Longitude' })
    longitude?: number;

    @ApiProperty({ description: 'Capacity' })
    capacity: number;

    @ApiProperty({ description: 'Pricing information' })
    pricing: Record<string, any>;

    @ApiPropertyOptional({ description: 'Amenities' })
    amenities?: Record<string, any>;

    @ApiPropertyOptional({ description: 'Images' })
    images?: string[];

    @ApiProperty({ description: 'Status', enum: BanquetStatus })
    status: BanquetStatus;

    @ApiProperty({ description: 'Owner ID' })
    ownerId: string;

    @ApiProperty({ description: 'Created date' })
    createdAt: Date;

    @ApiProperty({ description: 'Updated date' })
    updatedAt: Date;

    constructor(banquet: any) {
        this.id = banquet._id?.toHexString() || banquet.id;
        this.name = banquet.name;
        this.description = banquet.description;
        this.address = banquet.address;
        this.city = banquet.city;
        this.state = banquet.state;
        this.pincode = banquet.pincode;
        this.latitude = banquet.latitude;
        this.longitude = banquet.longitude;
        this.capacity = banquet.capacity;
        this.pricing = banquet.pricing;
        this.amenities = banquet.amenities;
        this.images = banquet.images;
        this.status = banquet.status;
        this.ownerId = banquet.ownerId?.toHexString() || banquet.ownerId;
        this.createdAt = banquet.createdAt;
        this.updatedAt = banquet.updatedAt;
    }

    static fromDocument(banquet: any): BanquetResponseDto {
        return new BanquetResponseDto(banquet);
    }

    static fromDocuments(banquets: any[]): BanquetResponseDto[] {
        return banquets.map(b => BanquetResponseDto.fromDocument(b));
    }
}
