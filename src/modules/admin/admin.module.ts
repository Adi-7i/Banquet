import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { UserManagementService } from './services/user-management.service';
import { BanquetManagementService } from './services/banquet-management.service';
import { AnalyticsService } from './services/analytics.service';
import { SupportTicketService } from './services/support-ticket.service';
import { AuditLogService } from './services/audit-log.service';
import { AdminPermissionsGuard } from './guards/admin-permissions.guard';
import { AdminActivity, AdminActivitySchema } from '@infrastructure/database/schemas/admin-activity.schema';
import { SupportTicket, SupportTicketSchema } from '@infrastructure/database/schemas/support-ticket.schema';
import { FeaturedListing, FeaturedListingSchema } from '@infrastructure/database/schemas/featured-listing.schema';
import { User, UserSchema } from '@infrastructure/database/schemas/user.schema';
import { Booking, BookingSchema } from '@infrastructure/database/schemas/booking.schema';
import { Banquet, BanquetSchema } from '@infrastructure/database/schemas/banquet.schema';
import { Review, ReviewSchema } from '@infrastructure/database/schemas/review.schema';
import { AuthModule } from '@modules/auth/auth.module';

/**
 * Admin Module
 * Comprehensive admin panel with user/banquet management, analytics, and support
 */
@Module({
    imports: [
        MongooseModule.forFeature([
            { name: AdminActivity.name, schema: AdminActivitySchema },
            { name: SupportTicket.name, schema: SupportTicketSchema },
            { name: FeaturedListing.name, schema: FeaturedListingSchema },
            { name: User.name, schema: UserSchema },
            { name: Booking.name, schema: BookingSchema },
            { name: Banquet.name, schema: BanquetSchema },
            { name: Review.name, schema: ReviewSchema },
        ]),
        AuthModule,
    ],
    controllers: [AdminController],
    providers: [
        UserManagementService,
        BanquetManagementService,
        AnalyticsService,
        SupportTicketService,
        AuditLogService,
        AdminPermissionsGuard,
    ],
    exports: [AuditLogService],
})
export class AdminModule { }
