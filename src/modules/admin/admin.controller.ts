import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Body,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
    Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { UserRole, UserStatus } from '@infrastructure/database/schemas/user.schema';
import { AdminPermissionsGuard } from './guards/admin-permissions.guard';
import { RequirePermissions } from './decorators/permissions.decorator';
import { AdminPermission } from './enums/admin-permissions.enum';
import { UserManagementService } from './services/user-management.service';
import { BanquetManagementService } from './services/banquet-management.service';
import { AnalyticsService } from './services/analytics.service';
import { SupportTicketService } from './services/support-ticket.service';
import { AuditLogService } from './services/audit-log.service';
import {
    SuspendUserDto,
    ActivateUserDto,
    ChangeUserRoleDto,
    ApproveBanquetDto,
    RejectBanquetDto,
    FeatureBanquetDto,
    AssignTicketDto,
    UpdateTicketStatusDto,
    AddTicketMessageDto,
    ResolveTicketDto,
} from './dto/admin.dto';
import { Request } from 'express';

/**
 * Admin Controller
 * Comprehensive admin panel API
 */
@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard, AdminPermissionsGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminController {
    constructor(
        private readonly userService: UserManagementService,
        private readonly banquetService: BanquetManagementService,
        private readonly analyticsService: AnalyticsService,
        private readonly ticketService: SupportTicketService,
        private readonly auditLogService: AuditLogService,
    ) { }

    // ========== DASHBOARD ==========

    @Get('dashboard/overview')
    @RequirePermissions(AdminPermission.VIEW_ANALYTICS)
    @ApiOperation({ summary: 'Get dashboard overview' })
    async getDashboardOverview() {
        return this.analyticsService.getDashboardOverview();
    }

    @Get('dashboard/users')
    @RequirePermissions(AdminPermission.VIEW_ANALYTICS)
    @ApiOperation({ summary: 'Get user growth metrics' })
    @ApiQuery({ name: 'days', required: false, type: Number })
    async getUserGrowth(@Query('days') days: number = 30) {
        return this.analyticsService.getUserGrowthMetrics(+days);
    }

    @Get('dashboard/bookings')
    @RequirePermissions(AdminPermission.VIEW_ANALYTICS)
    @ApiOperation({ summary: 'Get booking analytics' })
    @ApiQuery({ name: 'days', required: false, type: Number })
    async getBookingAnalytics(@Query('days') days: number = 30) {
        return this.analyticsService.getBookingAnalytics(+days);
    }

    @Get('dashboard/top-banquets')
    @RequirePermissions(AdminPermission.VIEW_ANALYTICS)
    @ApiOperation({ summary: 'Get top performing banquets' })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getTopBanquets(@Query('limit') limit: number = 10) {
        return this.analyticsService.getTopBanquets(+limit);
    }

    @Get('dashboard/top-locations')
    @RequirePermissions(AdminPermission.VIEW_ANALYTICS)
    @ApiOperation({ summary: 'Get top locations' })
    async getTopLocations() {
        return this.analyticsService.getTopLocations();
    }

    // ========== USER MANAGEMENT ==========

    @Get('users')
    @RequirePermissions(AdminPermission.MANAGE_USERS)
    @ApiOperation({ summary: 'Get all users' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'role', required: false, enum: UserRole })
    @ApiQuery({ name: 'status', required: false, enum: UserStatus })
    @ApiQuery({ name: 'search', required: false, type: String })
    async getUsers(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20,
        @Query('role') role?: UserRole,
        @Query('status') status?: UserStatus,
        @Query('search') search?: string,
    ) {
        return this.userService.getUsers(+page, +limit, { role, status, search });
    }

    @Get('users/stats')
    @RequirePermissions(AdminPermission.VIEW_ANALYTICS)
    @ApiOperation({ summary: 'Get user statistics' })
    async getUserStats() {
        return this.userService.getUserStats();
    }

    @Post('users/:id/suspend')
    @RequirePermissions(AdminPermission.MANAGE_USERS)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Suspend a user' })
    async suspendUser(
        @Param('id') id: string,
        @CurrentUser() user: any,
        @Body() dto: SuspendUserDto,
        @Req() req: Request,
    ) {
        return this.userService.suspendUser(id, user.sub, dto.reason, req.ip);
    }

    @Post('users/:id/activate')
    @RequirePermissions(AdminPermission.MANAGE_USERS)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Activate a user' })
    async activateUser(
        @Param('id') id: string,
        @CurrentUser() user: any,
        @Body() dto: ActivateUserDto,
        @Req() req: Request,
    ) {
        return this.userService.activateUser(id, user.sub, dto.reason, req.ip);
    }

    @Patch('users/:id/role')
    @RequirePermissions(AdminPermission.MANAGE_USERS)
    @ApiOperation({ summary: 'Change user role' })
    async changeUserRole(
        @Param('id') id: string,
        @CurrentUser() user: any,
        @Body() dto: ChangeUserRoleDto,
        @Req() req: Request,
    ) {
        return this.userService.changeUserRole(id, dto.role, user.sub, dto.reason, req.ip);
    }

    // ========== BANQUET MANAGEMENT ==========

    @Get('banquets/pending')
    @RequirePermissions(AdminPermission.MANAGE_BANQUETS)
    @ApiOperation({ summary: 'Get pending banquets' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getPendingBanquets(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20,
    ) {
        return this.banquetService.getPendingBanquets(+page, +limit);
    }

    @Get('banquets/stats')
    @RequirePermissions(AdminPermission.VIEW_ANALYTICS)
    @ApiOperation({ summary: 'Get banquet statistics' })
    async getBanquetStats() {
        return this.banquetService.getBanquetStats();
    }

    @Post('banquets/:id/approve')
    @RequirePermissions(AdminPermission.MANAGE_BANQUETS)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Approve a banquet' })
    async approveBanquet(
        @Param('id') id: string,
        @CurrentUser() user: any,
        @Body() dto: ApproveBanquetDto,
        @Req() req: Request,
    ) {
        return this.banquetService.approveBanquet(id, user.sub, dto.reason || 'Approved', req.ip);
    }

    @Post('banquets/:id/reject')
    @RequirePermissions(AdminPermission.MANAGE_BANQUETS)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Reject a banquet' })
    async rejectBanquet(
        @Param('id') id: string,
        @CurrentUser() user: any,
        @Body() dto: RejectBanquetDto,
        @Req() req: Request,
    ) {
        return this.banquetService.rejectBanquet(id, user.sub, dto.reason, req.ip);
    }

    @Post('banquets/:id/feature')
    @RequirePermissions(AdminPermission.MANAGE_FEATURED)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Feature a banquet' })
    async featureBanquet(
        @Param('id') id: string,
        @CurrentUser() user: any,
        @Body() dto: FeatureBanquetDto,
        @Req() req: Request,
    ) {
        return this.banquetService.featureBanquet(
            id,
            user.sub,
            dto.startDate,
            dto.endDate,
            dto.position,
            dto.fee,
            req.ip,
        );
    }

    @Get('banquets/featured')
    @RequirePermissions(AdminPermission.MANAGE_FEATURED)
    @ApiOperation({ summary: 'Get featured listings' })
    async getFeaturedListings() {
        return this.banquetService.getFeaturedListings();
    }

    // ========== SUPPORT TICKETS ==========

    @Get('tickets')
    @RequirePermissions(AdminPermission.MANAGE_SUPPORT)
    @ApiOperation({ summary: 'Get support tickets' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'status', required: false })
    @ApiQuery({ name: 'priority', required: false })
    async getTickets(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 20,
        @Query('status') status?: string,
        @Query('priority') priority?: string,
    ) {
        return this.ticketService.getTickets(+page, +limit, { status: status as any, priority: priority as any });
    }

    @Get('tickets/stats')
    @RequirePermissions(AdminPermission.MANAGE_SUPPORT)
    @ApiOperation({ summary: 'Get ticket statistics' })
    async getTicketStats() {
        return this.ticketService.getTicketStats();
    }

    @Post('tickets/:id/assign')
    @RequirePermissions(AdminPermission.MANAGE_SUPPORT)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Assign ticket' })
    async assignTicket(
        @Param('id') id: string,
        @CurrentUser() user: any,
        @Body() dto: AssignTicketDto,
        @Req() req: Request,
    ) {
        return this.ticketService.assignTicket(id, user.sub, dto.assigneeId, req.ip);
    }

    @Patch('tickets/:id/status')
    @RequirePermissions(AdminPermission.MANAGE_SUPPORT)
    @ApiOperation({ summary: 'Update ticket status' })
    async updateTicketStatus(
        @Param('id') id: string,
        @CurrentUser() user: any,
        @Body() dto: UpdateTicketStatusDto,
        @Req() req: Request,
    ) {
        return this.ticketService.updateTicketStatus(id, user.sub, dto.status, req.ip);
    }

    @Post('tickets/:id/message')
    @RequirePermissions(AdminPermission.MANAGE_SUPPORT)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Add message to ticket' })
    async addTicketMessage(
        @Param('id') id: string,
        @CurrentUser() user: any,
        @Body() dto: AddTicketMessageDto,
    ) {
        return this.ticketService.addMessage(id, user.sub, 'ADMIN', dto.content, dto.isInternal);
    }

    @Post('tickets/:id/resolve')
    @RequirePermissions(AdminPermission.MANAGE_SUPPORT)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Resolve ticket' })
    async resolveTicket(
        @Param('id') id: string,
        @CurrentUser() user: any,
        @Body() dto: ResolveTicketDto,
        @Req() req: Request,
    ) {
        return this.ticketService.resolveTicket(id, user.sub, dto.summary, req.ip);
    }

    // ========== AUDIT LOG ==========

    @Get('activity')
    @RequirePermissions(AdminPermission.VIEW_ANALYTICS)
    @ApiOperation({ summary: 'Get recent admin activity' })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getRecentActivity(@Query('limit') limit: number = 50) {
        return this.auditLogService.getRecentActivities(+limit);
    }
}
