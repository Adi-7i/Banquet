import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * DTO for updating owner profile information
 */
export class UpdateOwnerDto {
    @ApiPropertyOptional({
        description: 'Business name',
        example: 'Royal Banquet Hall',
    })
    @IsOptional()
    @IsString()
    businessName?: string;

    @ApiPropertyOptional({
        description: 'Contact number',
        example: '+919876543210',
    })
    @IsOptional()
    @IsString()
    contactNumber?: string;

    @ApiPropertyOptional({
        description: 'Business address',
        example: '123 Main Street',
    })
    @IsOptional()
    @IsString()
    address?: string;

    @ApiPropertyOptional({
        description: 'City',
        example: 'Mumbai',
    })
    @IsOptional()
    @IsString()
    city?: string;

    @ApiPropertyOptional({
        description: 'State',
        example: 'Maharashtra',
    })
    @IsOptional()
    @IsString()
    state?: string;

    @ApiPropertyOptional({
        description: 'Pincode',
        example: '400001',
    })
    @IsOptional()
    @IsString()
    pincode?: string;

    @ApiPropertyOptional({
        description: 'GST number',
        example: '27AABCU9603R1ZM',
    })
    @IsOptional()
    @IsString()
    gstNumber?: string;

    @ApiPropertyOptional({
        description: 'Business description',
        example: 'Premium banquet hall for weddings and events',
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({
        description: 'Website URL',
        example: 'https://royalbanquethall.com',
    })
    @IsOptional()
    @IsString()
    website?: string;
}
