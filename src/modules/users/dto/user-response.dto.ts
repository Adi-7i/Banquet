import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, UserStatus } from '@infrastructure/database/schemas/user.schema';

/**
 * User response DTO (excludes sensitive data like password)
 */
export class UserResponseDto {
    @ApiProperty({ description: 'User ID', example: '507f1f77bcf86cd799439011' })
    id: string;

    @ApiProperty({ description: 'Email address', example: 'user@example.com' })
    email: string;

    @ApiProperty({ description: 'User role', enum: UserRole, example: UserRole.CUSTOMER })
    role: UserRole;

    @ApiProperty({ description: 'Account status', enum: UserStatus, example: UserStatus.ACTIVE })
    status: UserStatus;

    @ApiPropertyOptional({ description: 'Owner profile data (if role is OWNER)' })
    ownerProfile?: any;

    @ApiPropertyOptional({ description: 'Customer profile data (if role is CUSTOMER)' })
    customerProfile?: any;

    @ApiProperty({ description: 'Account created date', example: '2024-01-01T00:00:00.000Z' })
    createdAt: Date;

    @ApiProperty({ description: 'Last updated date', example: '2024-01-01T00:00:00.000Z' })
    updatedAt: Date;

    constructor(user: any) {
        this.id = user._id?.toHexString() || user.id;
        this.email = user.email;
        this.role = user.role;
        this.status = user.status;
        this.ownerProfile = user.ownerProfile;
        this.customerProfile = user.customerProfile;
        this.createdAt = user.createdAt;
        this.updatedAt = user.updatedAt;
    }

    /**
     * Create response DTO from user document (excludes password)
     */
    static fromDocument(user: any): UserResponseDto {
        return new UserResponseDto(user);
    }

    /**
     * Create array of response DTOs
     */
    static fromDocuments(users: any[]): UserResponseDto[] {
        return users.map(user => UserResponseDto.fromDocument(user));
    }
}
