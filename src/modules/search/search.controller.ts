import {
    Controller,
    Post,
    Get,
    Body,
    Query,
    Ip,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { SearchService } from './services/search.service';
import { SearchBanquetDto } from './dto/search-banquet.dto';
import { SearchResultDto, SearchFacetsDto } from './dto/search-result.dto';
import { Public } from '@modules/auth/decorators/public.decorator';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';

/**
 * Search Controller
 * Public endpoints for banquet search and discovery
 */
@ApiTags('Search')
@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
    constructor(private readonly searchService: SearchService) { }

    /**
     * Main search endpoint
     */
    @Post('banquets')
    @Public()
    @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Search banquets with advanced filters',
        description: 'Public endpoint for searching banquets with location, capacity, price, amenities, and rating filters',
    })
    @ApiBody({ type: SearchBanquetDto })
    @ApiResponse({
        status: 200,
        description: 'Search results with pagination and metadata',
        type: SearchResultDto,
    })
    async searchBanquets(
        @Body() searchDto: SearchBanquetDto,
        @Ip() ipAddress: string,
        @CurrentUser() user?: any,
    ): Promise<SearchResultDto> {
        return this.searchService.searchBanquets(searchDto, user?.sub, ipAddress);
    }

    /**
     * Get search facets for filter UI
     */
    @Get('facets')
    @Public()
    @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
    @ApiOperation({
        summary: 'Get available filter options',
        description: 'Returns available cities, price ranges, capacity ranges, and amenities for building filter UI',
    })
    @ApiResponse({
        status: 200,
        description: 'Available filter facets',
        type: SearchFacetsDto,
    })
    async getSearchFacets(): Promise<SearchFacetsDto> {
        return this.searchService.getSearchFacets();
    }

    /**
     * Get autocomplete suggestions
     */
    @Get('suggestions')
    @Public()
    @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute
    @ApiOperation({ summary: 'Get search autocomplete suggestions' })
    @ApiResponse({
        status: 200,
        description: 'Search suggestions based on popular queries',
        type: [String],
    })
    async getSearchSuggestions(
        @Query('q') query: string,
        @Query('limit') limit?: number,
    ): Promise<string[]> {
        return this.searchService.getSearchSuggestions(query, limit || 10);
    }

    /**
     * Get popular searches (analytics endpoint - optional auth)
     */
    @Get('popular')
    @Public()
    @ApiOperation({ summary: 'Get popular search queries' })
    @ApiResponse({
        status: 200,
        description: 'Popular search queries with stats',
    })
    async getPopularSearches(@Query('limit') limit?: number): Promise<any[]> {
        return this.searchService.getPopularSearches(limit || 10);
    }

    /**
     * Get trending locations
     */
    @Get('trending/locations')
    @Public()
    @ApiOperation({ summary: 'Get trending search locations' })
    @ApiResponse({
        status: 200,
        description: 'Trending cities/locations',
    })
    async getTrendingLocations(@Query('limit') limit?: number): Promise<any[]> {
        return this.searchService.getTrendingLocations(limit || 10);
    }

    /**
     * Get search statistics (admin view - future use)
     */
    @Get('stats')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get search statistics' })
    @ApiResponse({
        status: 200,
        description: 'Search analytics statistics',
    })
    async getSearchStats(): Promise<any> {
        return this.searchService.getSearchStats();
    }
}
