import {
    Controller,
    Post,
    Body,
    HttpCode,
    HttpStatus,
    Get,
    UseGuards,
    Req,
    Logger,
    Ip,
    Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './services/auth.service';
import { OtpService } from './services/otp.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SendOtpDto, VerifyOtpDto } from './dto/otp.dto';
import { AuthResponseDto, UserResponseDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { OtpType } from '@infrastructure/database/schemas/otp-verification.schema';
import { OtpTypeEnum } from './dto/otp.dto';
import { Throttle } from '@nestjs/throttler';

/**
 * Authentication Controller
 * Handles all authentication-related endpoints
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
    private readonly logger = new Logger(AuthController.name);

    constructor(
        private authService: AuthService,
        private otpService: OtpService,
    ) { }

    /**
     * Register a new user
     */
    @Public()
    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Register a new user' })
    @ApiResponse({
        status: 201,
        description: 'User successfully registered with JWT tokens',
        type: AuthResponseDto,
    })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    @ApiResponse({ status: 409, description: 'User already exists' })
    async register(@Body() registerDto: RegisterDto) {
        const result = await this.authService.register({
            email: registerDto.email,
            password: registerDto.password,
            role: registerDto.role,
            profileData: {
                ownerProfile: registerDto.ownerProfile,
                customerProfile: registerDto.customerProfile,
            },
        });

        this.logger.log(`User registered: ${result.user.email}`);

        return {
            success: true,
            message: 'User registered successfully',
            data: result,
        };
    }

    /**
     * Login with email and password
     */
    @Public()
    @Post('login')
    @HttpCode(HttpStatus.OK)
    @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
    @ApiOperation({ summary: 'Login with email and password' })
    @ApiResponse({
        status: 200,
        description: 'Login successful',
        type: AuthResponseDto,
    })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    @ApiResponse({ status: 429, description: 'Too many login attempts' })
    async login(
        @Body() loginDto: LoginDto,
        @Ip() ipAddress: string,
        @Headers('user-agent') userAgent: string,
    ) {
        const result = await this.authService.login({
            email: loginDto.email,
            password: loginDto.password,
            ipAddress,
            userAgent,
        });

        this.logger.log(`User logged in: ${loginDto.email}`);

        return {
            success: true,
            message: 'Login successful',
            data: result,
        };
    }

    /**
     * Refresh access token using refresh token
     */
    @Public()
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Refresh access token' })
    @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
    @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
    async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
        const { accessToken } = await this.authService.refreshAccessToken(
            refreshTokenDto.refreshToken,
        );

        return {
            success: true,
            message: 'Token refreshed successfully',
            data: { accessToken },
        };
    }

    /**
     * Logout (revoke refresh token)
     */
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Logout and revoke refresh token' })
    @ApiResponse({ status: 200, description: 'Logout successful' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async logout(@Body() refreshTokenDto: RefreshTokenDto) {
        await this.authService.logout(refreshTokenDto.refreshToken);

        return {
            success: true,
            message: 'Logout successful',
        };
    }

    /**
     * Logout from all devices (revoke all refresh tokens)
     */
    @Post('revoke-all')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Logout from all devices' })
    @ApiResponse({ status: 200, description: 'All sessions revoked' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async revokeAllSessions(@CurrentUser() user: any) {
        await this.authService.logoutAll(user.id);

        return {
            success: true,
            message: 'All sessions revoked successfully',
        };
    }

    /**
     * Get current authenticated user
     */
    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get current user information' })
    @ApiResponse({
        status: 200,
        description: 'User information retrieved',
        type: UserResponseDto,
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getCurrentUser(@CurrentUser() user: any) {
        // Remove password from response
        const { password, ...userWithoutPassword } = user;

        return {
            success: true,
            data: userWithoutPassword,
        };
    }

    /**
     * Send OTP for verification
     */
    @Public()
    @Post('send-otp')
    @HttpCode(HttpStatus.OK)
    @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 OTP requests per minute
    @ApiOperation({ summary: 'Send OTP for verification' })
    @ApiResponse({ status: 200, description: 'OTP sent successfully' })
    @ApiResponse({ status: 429, description: 'Too many OTP requests' })
    async sendOtp(@Body() sendOtpDto: SendOtpDto) {
        const result = await this.otpService.generateOtp(
            sendOtpDto.identifier,
            sendOtpDto.type === OtpTypeEnum.EMAIL ? OtpType.EMAIL : OtpType.PHONE,
        );

        return {
            success: true,
            ...result,
        };
    }

    /**
     * Verify OTP code
     */
    @Public()
    @Post('verify-otp')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Verify OTP code' })
    @ApiResponse({ status: 200, description: 'OTP verified successfully' })
    @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
    @ApiResponse({ status: 401, description: 'Maximum verification attempts exceeded' })
    async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
        await this.otpService.verifyOtp(
            verifyOtpDto.identifier,
            verifyOtpDto.otp,
            verifyOtpDto.type === OtpTypeEnum.EMAIL ? OtpType.EMAIL : OtpType.PHONE,
        );

        return {
            success: true,
            message: 'OTP verified successfully',
        };
    }
}
