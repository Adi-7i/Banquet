import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BanquetsService } from './services/banquets.service';
import { CreateBanquetDto } from './dto/create-banquet.dto';
import { UpdateBanquetDto } from './dto/update-banquet.dto';
import { QueryBanquetDto } from './dto/query-banquet.dto';
import { BanquetResponseDto } from './dto/banquet-response.dto';
import { PaginatedResponseDto } from '@common/dto/pagination.dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { Public } from '@modules/auth/decorators/public.decorator';
import { OptionalAuth } from '@modules/auth/decorators/optional-auth.decorator';
import { UserRole } from '@infrastructure/database/schemas/user.schema';
import { BanquetStatus } from '@infrastructure/database/schemas/banquet.schema';

/**
 * Banquets Controller
 * Handles HTTP requests for banquet management
 */
@ApiTags('Banquets')
@Controller('banquets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BanquetsController {
    constructor(private readonly banquetsService: BanquetsService) { }

    /**
     * Create new banquet (owner only)
     */
    @Post()
    @ApiBearerAuth()
    @Roles(UserRole.OWNER)
    @ApiOperation({ summary: 'Create new banquet (owner only)' })
    @ApiResponse({
        status: 201,
        description: 'Banquet created successfully',
        type: BanquetResponseDto,
    })
    async createBanquet(
        @CurrentUser() user: any,
        @Body() createBanquetDto: CreateBanquetDto,
    ): Promise<BanquetResponseDto> {
        return this.banquetsService.createBanquet(user.sub, createBanquetDto);
    }

    /**
     * Search banquets (public)
     */
    @Get()
    @Public()
    @ApiOperation({ summary: 'Search banquets with filters (public)' })
    @ApiResponse({
        status: 200,
        description: 'Banquets retrieved successfully',
    })
    async searchBanquets(
        @Query() query: QueryBanquetDto,
    ): Promise<PaginatedResponseDto<BanquetResponseDto>> {
        return this.banquetsService.searchBanquets(query);
    }

    /**
     * Get my banquets (owner)
     */
    @Get('my')
    @ApiBearerAuth()
    @Roles(UserRole.OWNER)
    @ApiOperation({ summary: 'Get my banquets (owner)' })
    @ApiResponse({
        status: 200,
        description: 'My banquets retrieved successfully',
        type: [BanquetResponseDto],
    })
    async getMyBanquets(@CurrentUser() user: any): Promise<BanquetResponseDto[]> {
        return this.banquetsService.getMyBanquets(user.sub);
    }

    /**
     * Get banquet by ID (public if published, owner can see own drafts)
     */
    @Get(':id')
    @OptionalAuth()
    @ApiOperation({ summary: 'Get banquet by ID' })
    @ApiResponse({
        status: 200,
        description: 'Banquet retrieved successfully',
        type: BanquetResponseDto,
    })
    async getBanquetById(
        @Param('id') id: string,
        @CurrentUser() user?: any,
    ): Promise<BanquetResponseDto> {
        return this.banquetsService.getBanquetById(id, user?.sub);
    }

    /**
     * Update banquet (owner, own banquets only)
     */
    @Patch(':id')
    @ApiBearerAuth()
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    @ApiOperation({ summary: 'Update banquet (owner)' })
    @ApiResponse({
        status: 200,
        description: 'Banquet updated successfully',
        type: BanquetResponseDto,
    })
    async updateBanquet(
        @Param('id') id: string,
        @CurrentUser() user: any,
        @Body() updateBanquetDto: UpdateBanquetDto,
    ): Promise<BanquetResponseDto> {
        return this.banquetsService.updateBanquet(id, user.sub, user.role, updateBanquetDto);
    }

    /**
     * Publish banquet (owner)
     */
    @Post(':id/publish')
    @ApiBearerAuth()
    @Roles(UserRole.OWNER)
    @ApiOperation({ summary: 'Publish banquet (draft → published)' })
    @ApiResponse({
        status: 200,
        description: 'Banquet published successfully',
        type: BanquetResponseDto,
    })
    @HttpCode(HttpStatus.OK)
    async publishBanquet(
        @Param('id') id: string,
        @CurrentUser() user: any,
    ): Promise<BanquetResponseDto> {
        return this.banquetsService.publishBanquet(id, user.sub);
    }

    /**
     * Unpublish banquet (owner)
     */
    @Post(':id/unpublish')
    @ApiBearerAuth()
    @Roles(UserRole.OWNER)
    @ApiOperation({ summary: 'Unpublish banquet (published → unavailable)' })
    @ApiResponse({
        status: 200,
        description: 'Banquet unpublished successfully',
        type: BanquetResponseDto,
    })
    @HttpCode(HttpStatus.OK)
    async unpublishBanquet(
        @Param('id') id: string,
        @CurrentUser() user: any,
    ): Promise<BanquetResponseDto> {
        return this.banquetsService.unpublishBanquet(id, user.sub);
    }

    /**
     * Delete banquet (owner)
     */
    @Delete(':id')
    @ApiBearerAuth()
    @Roles(UserRole.OWNER)
    @ApiOperation({ summary: 'Delete banquet (soft delete, owner)' })
    @ApiResponse({
        status: 200,
        description: 'Banquet deleted successfully',
    })
    @HttpCode(HttpStatus.OK)
    async deleteBanquet(
        @Param('id') id: string,
        @CurrentUser() user: any,
    ): Promise<{ message: string }> {
        return this.banquetsService.deleteBanquet(id, user.sub);
    }
}
