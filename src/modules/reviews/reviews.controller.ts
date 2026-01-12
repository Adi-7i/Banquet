import {
    Controller,
    Post,
    Get,
    Patch,
    Delete,
    Param,
    Body,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReviewService } from './services/review.service';
import { ModerationService } from './services/moderation.service';
import { CreateReviewDto, UpdateReviewDto, OwnerReplyDto, RejectReviewDto } from './dto/review.dto';
import { ReviewResponseDto, ReviewsPaginatedDto } from './dto/review-response.dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { UserRole } from '@infrastructure/database/schemas/user.schema';
import { Throttle } from '@nestjs/throttler';

/**
 * Reviews Controller
 * Manages reviews with RBAC enforcement
 */
@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
    constructor(
        private readonly reviewService: ReviewService,
        private readonly moderationService: ModerationService,
    ) { }

    // ========== CUSTOMER ENDPOINTS ==========

    /**
     * Create a review (Customer with completed booking)
     */
    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CUSTOMER)
    @ApiBearerAuth()
    @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 reviews per hour
    @ApiOperation({ summary: 'Create a review (requires completed booking)' })
    @ApiResponse({ status: 201, description: 'Review created', type: ReviewResponseDto })
    async createReview(
        @CurrentUser() user: any,
        @Body() dto: CreateReviewDto,
    ): Promise<ReviewResponseDto> {
        return this.reviewService.createReview(user.sub, dto);
    }

    /**
     * Update own review
     */
    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CUSTOMER)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update own review' })
    @ApiResponse({ status: 200, description: 'Review updated', type: ReviewResponseDto })
    async updateReview(
        @Param('id') id: string,
        @CurrentUser() user: any,
        @Body() dto: UpdateReviewDto,
    ): Promise<ReviewResponseDto> {
        return this.reviewService.updateReview(id, user.sub, dto);
    }

    /**
     * Delete own review
     */
    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete review (owner or admin)' })
    async deleteReview(
        @Param('id') id: string,
        @CurrentUser() user: any,
    ): Promise<void> {
        const isAdmin = user.role === UserRole.ADMIN;
        await this.reviewService.deleteReview(id, user.sub, isAdmin);
    }

    /**
     * Get my reviews
     */
    @Get('my')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.CUSTOMER)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get my reviews' })
    @ApiResponse({ status: 200, description: 'Customer reviews', type: [ReviewResponseDto] })
    async getMyReviews(@CurrentUser() user: any): Promise<ReviewResponseDto[]> {
        return this.reviewService.getCustomerReviews(user.sub);
    }

    // ========== PUBLIC ENDPOINTS ==========

    /**
     * Get reviews for banquet (public)
     */
    @Get('banquet/:banquetId')
    @ApiOperation({ summary: 'Get reviews for banquet (public)' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'sortBy', required: false, enum: ['recent', 'rating_high', 'rating_low'] })
    @ApiResponse({ status: 200, description: 'Banquet reviews', type: ReviewsPaginatedDto })
    async getBanquetReviews(
        @Param('banquetId') banquetId: string,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Query('sortBy') sortBy: 'recent' | 'rating_high' | 'rating_low' = 'recent',
    ): Promise<ReviewsPaginatedDto> {
        return this.reviewService.getBanquetReviews(banquetId, +page, +limit, sortBy);
    }

    // ========== OWNER ENDPOINTS ==========

    /**
     * Add owner reply
     */
    @Post(':id/reply')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.OWNER)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Add owner reply to review' })
    @ApiResponse({ status: 200, description: 'Reply added', type: ReviewResponseDto })
    async addOwnerReply(
        @Param('id') id: string,
        @CurrentUser() user: any,
        @Body() dto: OwnerReplyDto,
    ): Promise<ReviewResponseDto> {
        return this.reviewService.addOwnerReply(id, user.sub, dto);
    }

    // ========== ADMIN ENDPOINTS ==========

    /**
     * Get pending moderation queue
     */
    @Get('moderation/pending')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get pending moderation queue (Admin)' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'Pending reviews', type: ReviewsPaginatedDto })
    async getPendingReviews(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20,
    ): Promise<ReviewsPaginatedDto> {
        return this.moderationService.getPendingReviews(+page, +limit);
    }

    /**
     * Approve review
     */
    @Post(':id/approve')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Approve review (Admin)' })
    @ApiResponse({ status: 200, description: 'Review approved', type: ReviewResponseDto })
    async approveReview(
        @Param('id') id: string,
        @CurrentUser() user: any,
    ): Promise<ReviewResponseDto> {
        return this.moderationService.approveReview(id, user.sub);
    }

    /**
     * Reject review
     */
    @Post(':id/reject')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Reject review (Admin)' })
    @ApiResponse({ status: 200, description: 'Review rejected', type: ReviewResponseDto })
    async rejectReview(
        @Param('id') id: string,
        @CurrentUser() user: any,
        @Body() dto: RejectReviewDto,
    ): Promise<ReviewResponseDto> {
        return this.moderationService.rejectReview(id, user.sub, dto.reason);
    }
}
