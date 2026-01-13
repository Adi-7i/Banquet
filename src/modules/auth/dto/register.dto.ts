import { ApiProperty } from '@nestjs/swagger';
import {
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsString,
    MinLength,
    ValidateNested,
    IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '@infrastructure/database/schemas/user.schema';

export class OwnerProfileDataDto {
    @ApiProperty({ example: 'Royal Banquet Hall', description: 'Business name' })
    @IsString()
    @IsNotEmpty()
    businessName: string;

    @ApiProperty({ example: '+919876543210', description: 'Contact number' })
    @IsString()
    @IsNotEmpty()
    contactNumber: string;

    @ApiProperty({ required: false, example: 'Business description' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ required: false, example: 'Mumbai' })
    @IsString()
    @IsOptional()
    city?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    address?: string;
}

export class CustomerProfileDataDto {
    @ApiProperty({ example: 'John', description: 'First name' })
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @ApiProperty({ example: 'Doe', description: 'Last name' })
    @IsString()
    @IsNotEmpty()
    lastName: string;

    @ApiProperty({ example: '+919876543210', description: 'Phone number' })
    @IsString()
    @IsNotEmpty()
    phoneNumber: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    city?: string;
}

export class RegisterDto {
    @ApiProperty({ example: 'user@example.com', description: 'User email address' })
    @IsEmail({}, { message: 'Invalid email format' })
    @IsNotEmpty()
    email: string;

    @ApiProperty({
        example: 'mypassword',
        description: 'User password',
    })
    @IsString()
    @IsNotEmpty()
    password: string;

    @ApiProperty({
        enum: UserRole,
        example: UserRole.CUSTOMER,
        description: 'User role (ADMIN, OWNER, CUSTOMER)',
    })
    @IsEnum(UserRole, { message: 'Invalid role' })
    @IsNotEmpty()
    role: UserRole;

    @ApiProperty({
        required: false,
        description: 'Owner profile data (required if role is OWNER)',
        type: OwnerProfileDataDto,
    })
    @ValidateNested()
    @Type(() => OwnerProfileDataDto)
    @IsOptional()
    ownerProfile?: OwnerProfileDataDto;

    @ApiProperty({
        required: false,
        description: 'Customer profile data (required if role is CUSTOMER)',
        type: CustomerProfileDataDto,
    })
    @ValidateNested()
    @Type(() => CustomerProfileDataDto)
    @IsOptional()
    customerProfile?: CustomerProfileDataDto;
}
