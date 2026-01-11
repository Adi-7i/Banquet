import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsObject,
    Min,
    IsArray,
} from 'class-validator';

/**
 * DTO for creating a new banquet
 */
export class CreateBanquetDto {
    @ApiProperty({ description: 'Banquet name', example: 'Royal Palace Banquet Hall' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ description: 'Banquet description' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ description: 'Address', example: '123 Main Street' })
    @IsString()
    @IsNotEmpty()
    address: string;

    @ApiProperty({ description: 'City', example: 'Mumbai' })
    @IsString()
    @IsNotEmpty()
    city: string;

    @ApiProperty({ description: 'State', example: 'Maharashtra' })
    @IsString()
    @IsNotEmpty()
    state: string;

    @ApiProperty({ description: 'Pincode', example: '400001' })
    @IsString()
    @IsNotEmpty()
    pincode: string;

    @ApiPropertyOptional({ description: 'Latitude', example: 19.0760 })
    @IsNumber()
    @IsOptional()
    latitude?: number;

    @ApiPropertyOptional({ description: 'Longitude', example: 72.8777 })
    @IsNumber()
    @IsOptional()
    longitude?: number;

    @ApiProperty({ description: 'Capacity (people)', example: 500, minimum: 1 })
    @IsNumber()
    @Min(1)
    capacity: number;

    @ApiProperty({ description: 'Pricing information (flexible object)', example: { perPlate: 800, minimumGuests: 100 } })
    @IsObject()
    pricing: Record<string, any>;

    @ApiPropertyOptional({ description: 'Amenities', example: { parking: true, ac: true, catering: true } })
    @IsObject()
    @IsOptional()
    amenities?: Record<string, any>;

    @ApiPropertyOptional({ description: 'Image URLs', example: ['https://example.com/image1.jpg'] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    images?: string[];
}
