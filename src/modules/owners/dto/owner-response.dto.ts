import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Owner response DTO
 */
export class OwnerResponseDto {
    @ApiProperty({ description: 'Owner profile ID', example: '507f1f77bcf86cd799439011' })
    id: string;

    @ApiProperty({ description: 'User ID', example: '507f1f77bcf86cd799439011' })
    userId: string;

    @ApiProperty({ description: 'Business name', example: 'Royal Banquet Hall' })
    businessName: string;

    @ApiProperty({ description: 'Contact number', example: '+919876543210' })
    contactNumber: string;

    @ApiPropertyOptional({ description: 'Business address', example: '123 Main Street' })
    address?: string;

    @ApiPropertyOptional({ description: 'City', example: 'Mumbai' })
    city?: string;

    @ApiPropertyOptional({ description: 'State', example: 'Maharashtra' })
    state?: string;

    @ApiPropertyOptional({ description: 'Pincode', example: '400001' })
    pincode?: string;

    @ApiPropertyOptional({ description: 'GST number', example: '27AABCU9603R1ZM' })
    gstNumber?: string;

    @ApiPropertyOptional({ description: 'Business description' })
    description?: string;

    @ApiPropertyOptional({ description: 'Website URL', example: 'https://example.com' })
    website?: string;

    @ApiProperty({ description: 'Profile created date' })
    createdAt: Date;

    @ApiProperty({ description: 'Last updated date' })
    updatedAt: Date;

    @ApiPropertyOptional({ description: 'Associated banquets (if included)' })
    banquets?: any[];

    constructor(owner: any) {
        this.id = owner._id?.toHexString() || owner.id;
        this.userId = owner.userId?.toHexString() || owner.userId;
        this.businessName = owner.businessName;
        this.contactNumber = owner.contactNumber;
        this.address = owner.address;
        this.city = owner.city;
        this.state = owner.state;
        this.pincode = owner.pincode;
        this.gstNumber = owner.gstNumber;
        this.description = owner.description;
        this.website = owner.website;
        this.createdAt = owner.createdAt;
        this.updatedAt = owner.updatedAt;
        this.banquets = owner.banquets;
    }

    static fromDocument(owner: any): OwnerResponseDto {
        return new OwnerResponseDto(owner);
    }

    static fromDocuments(owners: any[]): OwnerResponseDto[] {
        return owners.map(owner => OwnerResponseDto.fromDocument(owner));
    }
}
