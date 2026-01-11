import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString } from 'class-validator';
import { PaginationQueryDto } from '@common/dto/pagination.dto';
import { UserRole, UserStatus } from '@infrastructure/database/schemas/user.schema';

/**
 * DTO for querying users with filters
 */
export class QueryUserDto extends PaginationQueryDto {
    @ApiPropertyOptional({
        description: 'Search by email (partial match)',
        example: 'john@example.com',
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({
        description: 'Filter by role',
        enum: UserRole,
        example: UserRole.CUSTOMER,
    })
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;

    @ApiPropertyOptional({
        description: 'Filter by status',
        enum: UserStatus,
        example: UserStatus.ACTIVE,
    })
    @IsOptional()
    @IsEnum(UserStatus)
    status?: UserStatus;
}
