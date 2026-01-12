import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SearchController } from './search.controller';
import { SearchService } from './services/search.service';
import { SearchCacheService } from './services/search-cache.service';
import { SearchAnalyticsService } from './services/search-analytics.service';
import { SearchRepository } from './repositories/search.repository';
import { Banquet, BanquetSchema } from '@infrastructure/database/schemas/banquet.schema';
import { SearchAnalytics, SearchAnalyticsSchema } from '@infrastructure/database/schemas/search-analytics.schema';
import { RedisModule } from '@infrastructure/cache/redis.module';
import { AuthModule } from '@modules/auth/auth.module';

/**
 * Search Module
 * Advanced search and discovery for banquets
 */
@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Banquet.name, schema: BanquetSchema },
            { name: SearchAnalytics.name, schema: SearchAnalyticsSchema },
        ]),
        RedisModule,
        AuthModule,
    ],
    controllers: [SearchController],
    providers: [
        SearchService,
        SearchCacheService,
        SearchAnalyticsService,
        SearchRepository,
    ],
    exports: [SearchService, SearchCacheService],
})
export class SearchModule { }
