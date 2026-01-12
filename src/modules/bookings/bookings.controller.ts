import {
    Controller,
    Post,
    Get,
    Patch,
    Param,
    Body,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BookingService } from './services/booking.service';
import { CreateBookingDto, RescheduleBookingDto, CancelBookingDto } from './dto/booking.dto';
import { BookingResponseDto } from './dto/booking-response.dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { UserRole } from '@infrastructure/database/schemas/user.schema';
import { BookingStatus } from '@infrastructure/database/schemas/booking.schema';

/**
 * Bookings Controller
 * Manages booking operations with RBAC
 */
@ApiTags('Bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BookingsController {
    constructor(private readonly bookingService: BookingService) { }

    /**
     * Create a new booking (Customer only)
     */
    @Post()
    @ApiBearerAuth()
    @Roles(UserRole.CUSTOMER)
    @ApiOperation({ summary: 'Create a new booking (Customer only)' })
    @ApiResponse({ status: 201, description: 'Booking created', type: BookingResponseDto })
    async createBooking(
        @CurrentUser() user: any,
        @Body() createBookingDto: CreateBookingDto,
    ): Promise<BookingResponseDto> {
        return this.bookingService.createBooking(user.sub, createBookingDto);
    }

    /**
     * Get my bookings
     */
    @Get('my')
    @ApiBearerAuth()
    @Roles(UserRole.CUSTOMER)
    @ApiOperation({ summary: 'Get my bookings' })
    @ApiResponse({ status: 200, description: 'Bookings retrieved', type: [BookingResponseDto] })
    async getMyBookings(
        @CurrentUser() user: any,
        @Query('status') status?: BookingStatus,
    ): Promise<BookingResponseDto[]> {
        return this.bookingService.getCustomerBookings(user.sub, status);
    }

    /**
     * Get booking by ID
     */
    @Get(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get booking details' })
    @ApiResponse({ status: 200, description: 'Booking retrieved', type: BookingResponseDto })
    async getBookingById(@Param('id') id: string): Promise<BookingResponseDto> {
        return this.bookingService.getBookingById(id);
    }

    /**
     * Confirm booking (Owner/Admin)
     */
    @Post(':id/confirm')
    @ApiBearerAuth()
    @Roles(UserRole.OWNER, UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Confirm booking (Owner/Admin)' })
    @ApiResponse({ status: 200, description: 'Booking confirmed', type: BookingResponseDto })
    async confirmBooking(
        @Param('id') id: string,
        @CurrentUser() user: any,
    ): Promise<BookingResponseDto> {
        return this.bookingService.confirmBooking(id, user.sub);
    }

    /**
     * Cancel booking
     */
    @Post(':id/cancel')
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Cancel booking' })
    @ApiResponse({ status: 200, description: 'Booking cancelled', type: BookingResponseDto })
    async cancelBooking(
        @Param('id') id: string,
        @CurrentUser() user: any,
        @Body() cancelDto: CancelBookingDto,
    ): Promise<BookingResponseDto> {
        return this.bookingService.cancelBooking(id, user.sub, cancelDto);
    }

    /**
     * Reschedule booking
     */
    @Patch(':id/reschedule')
    @ApiBearerAuth()
    @Roles(UserRole.CUSTOMER, UserRole.ADMIN)
    @ApiOperation({ summary: 'Reschedule booking' })
    @ApiResponse({ status: 200, description: 'Booking rescheduled', type: BookingResponseDto })
    async rescheduleBooking(
        @Param('id') id: string,
        @CurrentUser() user: any,
        @Body() rescheduleDto: RescheduleBookingDto,
    ): Promise<BookingResponseDto> {
        return this.bookingService.rescheduleBooking(id, user.sub, rescheduleDto);
    }
}
