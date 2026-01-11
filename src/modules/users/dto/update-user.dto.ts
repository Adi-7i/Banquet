import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEmail, IsEnum, IsString } from 'class-validator';
import { UserStatus } from '@infrastructure/database/schemas/user.schema';

/**
 * DTO for updating user information
 */
export class UpdateUserDto {
    @ApiPropertyOptional({
        description: 'User email address',
        example: 'newemail@example.com',
    })
    @IsOptional()
    @IsEmail({}, { message: 'Invalid email format' })
    email?: string;

    @ApiPropertyOptional({
        description: 'User account status',
        enum: UserStatus,
        example: UserStatus.ACTIVE,
    })
    @IsOptional()
    @IsEnum(UserStatus, { message: 'Invalid status' })
    status?: UserStatus;
}

/**
 * DTO for changing password
 */
export class ChangePasswordDto {
    @ApiPropertyOptional({
        description: 'Current password',
        example: 'OldPass@123',
    })
    @IsString()
    currentPassword: string;

    @ApiPropertyOptional({
        description: 'New password (min 8 chars, must include uppercase, lowercase, number, special char)',
        example: 'NewPass@123',
        minLength: 8,
    })
    @IsString()
    newPassword: string;
}
