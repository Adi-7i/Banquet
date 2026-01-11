import {
    Controller,
    Get,
    Patch,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OwnersService } from './services/owners.service';
import { UpdateOwnerDto } from './dto/update-owner.dto';
import { QueryOwnerDto } from './dto/query-owner.dto';
import { OwnerResponseDto } from './dto/owner-response.dto';
import { PaginatedResponseDto } from '@common/dto/pagination.dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { Public } from '@modules/auth/decorators/public.decorator';
import { UserRole } from '@infrastructure/database/schemas/user.schema';

/**
 * Owners Controller
 * Handles HTTP requests for owner profile management
 */
@ApiTags('Owners')
@Controller('owners')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OwnersController {
    constructor(private readonly ownersService: OwnersService) { }

    /**
     * Get current owner profile (owner role only)
     */
    @Get('me')
    @ApiBearerAuth()
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    @ApiOperation({ summary: 'Get current owner profile' })
    @ApiResponse({
        status: 200,
        description: 'Owner profile retrieved successfully',
        type: OwnerResponseDto,
    })
    async getMyProfile(@CurrentUser() user: any): Promise<OwnerResponseDto> {
        return this.ownersService.getOwnerProfile(user.sub);
    }

    /**
     * Update current owner profile (owner role only)
     */
    @Patch('me')
    @ApiBearerAuth()
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    @ApiOperation({ summary: 'Update current owner profile' })
    @ApiResponse({
        status: 200,
        description: 'Owner profile updated successfully',
        type: OwnerResponseDto,
    })
    async updateMyProfile(
        @CurrentUser() user: any,
        @Body() updateOwnerDto: UpdateOwnerDto,
    ): Promise<OwnerResponseDto> {
        return this.ownersService.updateOwnerProfile(
            user.sub,
            user.sub,
            user.role,
            updateOwnerDto,
        );
    }

    /**
     * List all owners (public endpoint)
     */
    @Get()
    @Public()
    @ApiOperation({ summary: 'List all owners (public)' })
    @ApiResponse({
        status: 200,
        description: 'Owners list retrieved successfully',
    })
    async listOwners(
        @Query() query: QueryOwnerDto,
    ): Promise<PaginatedResponseDto<OwnerResponseDto>> {
        return this.ownersService.listOwners(query);
    }

    /**
     * Get owner profile by ID with banquets (public endpoint)
     */
    @Get(':id')
    @Public()
    @ApiOperation({ summary: 'Get owner profile by ID with banquets (public)' })
    @ApiResponse({
        status: 200,
        description: 'Owner profile retrieved successfully',
        type: OwnerResponseDto,
    })
    async getOwnerById(@Param('id') id: string): Promise<OwnerResponseDto> {
        return this.ownersService.getPublicOwnerProfile(id);
    }
}
