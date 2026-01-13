import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsEnum, IsNumber, Min, MaxLength, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole, UserStatus } from '@infrastructure/database/schemas/user.schema';
import { TicketCategory, TicketPriority, TicketStatus } from '@infrastructure/database/schemas/support-ticket.schema';

// ========== USER MANAGEMENT DTOs ==========

export class SuspendUserDto {
    @ApiProperty({ description: 'Reason for suspension' })
    @IsNotEmpty()
    @IsString()
    @MaxLength(500)
    reason: string;
}

export class ActivateUserDto {
    @ApiProperty({ description: 'Reason for activation' })
    @IsNotEmpty()
    @IsString()
    @MaxLength(500)
    reason: string;
}

export class ChangeUserRoleDto {
    @ApiProperty({ enum: UserRole })
    @IsNotEmpty()
    @IsEnum(UserRole)
    role: UserRole;

    @ApiProperty({ description: 'Reason for role change' })
    @IsNotEmpty()
    @IsString()
    @MaxLength(500)
    reason: string;
}

// ========== BANQUET MANAGEMENT DTOs ==========

export class ApproveBanquetDto {
    @ApiPropertyOptional({ description: 'Approval notes' })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    reason?: string;
}

export class RejectBanquetDto {
    @ApiProperty({ description: 'Rejection reason' })
    @IsNotEmpty()
    @IsString()
    @MaxLength(500)
    reason: string;
}

export class FeatureBanquetDto {
    @ApiProperty({ description: 'Start date' })
    @IsNotEmpty()
    @Type(() => Date)
    @IsDate()
    startDate: Date;

    @ApiProperty({ description: 'End date' })
    @IsNotEmpty()
    @Type(() => Date)
    @IsDate()
    endDate: Date;

    @ApiProperty({ description: 'Position (1-100)', minimum: 1 })
    @IsNumber()
    @Min(1)
    position: number;

    @ApiProperty({ description: 'Fee amount' })
    @IsNumber()
    @Min(0)
    fee: number;
}

// ========== SUPPORT TICKET DTOs ==========

export class CreateTicketDto {
    @ApiProperty({ enum: TicketCategory })
    @IsNotEmpty()
    @IsEnum(TicketCategory)
    category: TicketCategory;

    @ApiProperty({ description: 'Ticket subject', maxLength: 200 })
    @IsNotEmpty()
    @IsString()
    @MaxLength(200)
    subject: string;

    @ApiProperty({ description: 'Ticket description', maxLength: 5000 })
    @IsNotEmpty()
    @IsString()
    @MaxLength(5000)
    description: string;

    @ApiPropertyOptional({ enum: TicketPriority })
    @IsOptional()
    @IsEnum(TicketPriority)
    priority?: TicketPriority;

    @ApiPropertyOptional({ description: 'Related booking ID' })
    @IsOptional()
    @IsString()
    relatedBookingId?: string;
}

export class AssignTicketDto {
    @ApiProperty({ description: 'Admin ID to assign' })
    @IsNotEmpty()
    @IsString()
    assigneeId: string;
}

export class UpdateTicketStatusDto {
    @ApiProperty({ enum: TicketStatus })
    @IsNotEmpty()
    @IsEnum(TicketStatus)
    status: TicketStatus;
}

export class AddTicketMessageDto {
    @ApiProperty({ description: 'Message content', maxLength: 2000 })
    @IsNotEmpty()
    @IsString()
    @MaxLength(2000)
    content: string;

    @ApiPropertyOptional({ description: 'Internal note (not visible to customer)' })
    @IsOptional()
    isInternal?: boolean;
}

export class ResolveTicketDto {
    @ApiProperty({ description: 'Resolution summary', maxLength: 1000 })
    @IsNotEmpty()
    @IsString()
    @MaxLength(1000)
    summary: string;
}
