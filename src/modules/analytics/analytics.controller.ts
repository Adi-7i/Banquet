import {
    Controller,
    Get,
    Post,
    Body,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { UserRole } from '@infrastructure/database/schemas/user.schema';
import { EventTrackerService } from './services/event-tracker.service';
import { MetricsService } from './services/metrics.service';
import { ObservabilityService } from './services/observability.service';
import { AnalyticsEventType } from '@infrastructure/database/schemas/analytics-event.schema';

/**
 * Analytics Controller
 * Dashboard APIs for analytics and observability
 */
@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
    constructor(
        private readonly eventTracker: EventTrackerService,
        private readonly metricsService: MetricsService,
        private readonly observabilityService: ObservabilityService,
    ) { }

    // ========== PUBLIC EVENT TRACKING ==========

    @Post('track/pageview')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Track page view (public)' })
    async trackPageView(
        @Body() body: { sessionId: string; page: string; userId?: string },
    ): Promise<{ success: boolean }> {
        await this.eventTracker.trackPageView(
            body.sessionId,
            body.page,
            body.userId,
        );
        return { success: true };
    }

    @Post('track/search')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Track search (public)' })
    async trackSearch(
        @Body() body: { sessionId: string; query: string; resultsCount: number; userId?: string },
    ): Promise<{ success: boolean }> {
        await this.eventTracker.trackSearch(
            body.sessionId,
            body.query,
            body.resultsCount,
            undefined,
            body.userId,
        );
        return { success: true };
    }

    @Post('track/banquet-view')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Track banquet view (public)' })
    async trackBanquetView(
        @Body() body: { sessionId: string; banquetId: string; userId?: string },
    ): Promise<{ success: boolean }> {
        await this.eventTracker.trackBanquetView(
            body.sessionId,
            body.banquetId,
            body.userId,
        );
        return { success: true };
    }

    // ========== ADMIN ANALYTICS ENDPOINTS ==========

    @Get('funnel')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get booking funnel metrics (admin)' })
    @ApiQuery({ name: 'days', required: false, type: Number })
    async getBookingFunnel(@Query('days') days: number = 30) {
        return this.metricsService.getBookingFunnelMetrics(+days);
    }

    @Get('revenue')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get revenue metrics (admin)' })
    @ApiQuery({ name: 'days', required: false, type: Number })
    async getRevenue(@Query('days') days: number = 30) {
        return this.metricsService.getRevenueMetrics(+days);
    }

    @Get('users')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get user activity metrics (admin)' })
    @ApiQuery({ name: 'days', required: false, type: Number })
    async getUserActivity(@Query('days') days: number = 30) {
        return this.metricsService.getUserActivityMetrics(+days);
    }

    @Get('search')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get search analytics (admin)' })
    @ApiQuery({ name: 'days', required: false, type: Number })
    async getSearchAnalytics(@Query('days') days: number = 7) {
        return this.metricsService.getSearchAnalytics(+days);
    }

    // ========== OBSERVABILITY ENDPOINTS ==========

    @Get('health')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get system health (admin)' })
    async getSystemHealth() {
        return this.observabilityService.getSystemHealth();
    }

    @Get('performance')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get performance stats (admin)' })
    @ApiQuery({ name: 'hours', required: false, type: Number })
    async getPerformanceStats(@Query('hours') hours: number = 24) {
        return this.observabilityService.getRequestStats(+hours);
    }

    @Get('slow-requests')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get slow requests (admin)' })
    @ApiQuery({ name: 'hours', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getSlowRequests(
        @Query('hours') hours: number = 24,
        @Query('limit') limit: number = 100,
    ) {
        return this.observabilityService.getSlowRequests(+hours, +limit);
    }

    @Get('errors')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get error rates (admin)' })
    @ApiQuery({ name: 'hours', required: false, type: Number })
    async getErrorRates(@Query('hours') hours: number = 24) {
        return this.observabilityService.getErrorRates(+hours);
    }

    @Get('events')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get event distribution (admin)' })
    @ApiQuery({ name: 'days', required: false, type: Number })
    async getEventDistribution(@Query('days') days: number = 7) {
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        return this.eventTracker.getEventDistribution(startDate, new Date());
    }
}
