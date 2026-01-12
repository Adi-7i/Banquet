import {
    Injectable,
    Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PasswordService } from './password.service';
import { TokenService, TokenPayload } from './token.service';
import { User, UserDocument, UserRole, UserStatus } from '@infrastructure/database/schemas/user.schema';
import { OwnerProfile, OwnerProfileDocument } from '@infrastructure/database/schemas/owner-profile.schema';
import { CustomerProfile, CustomerProfileDocument } from '@infrastructure/database/schemas/customer-profile.schema';
import { LoginAttempt, LoginAttemptDocument } from '@infrastructure/database/schemas/login-attempt.schema';
import {
    AuthenticationError,
    ValidationError,
    ConflictError,
    RateLimitError,
} from '@common/errors';
import { ErrorCodes } from '@common/errors';

export interface RegisterInput {
    email: string;
    password: string;
    role: UserRole;
    // Profile data will vary based on role
    profileData?: any;
}

export interface LoginInput {
    email: string;
    password: string;
    deviceInfo?: string;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Authentication Service
 * Core authentication logic: register, login, logout, refresh tokens
 */
@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    private readonly loginAttemptLimit: number;
    private readonly loginAttemptWindow: number; // in seconds

    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(OwnerProfile.name) private ownerProfileModel: Model<OwnerProfileDocument>,
        @InjectModel(CustomerProfile.name) private customerProfileModel: Model<CustomerProfileDocument>,
        @InjectModel(LoginAttempt.name) private loginAttemptModel: Model<LoginAttemptDocument>,
        private passwordService: PasswordService,
        private tokenService: TokenService,
    ) {
        // These would come from ConfigService in a real implementation
        this.loginAttemptLimit = 5;
        this.loginAttemptWindow = 900; // 15 minutes
    }

    /**
     * Register a new user and generate JWT tokens
     */
    async register(input: RegisterInput) {
        const { email, password, role, profileData } = input;

        // Check if user already exists
        const existingUser = await this.userModel.findOne({ email }).exec();

        if (existingUser) {
            throw new ConflictError(
                'User with this email already exists',
                ErrorCodes.USER_EMAIL_EXISTS,
            );
        }

        // Create user without password hash
        const user = await this.userModel.create({
            email,
            password, // Store password as-is, no hashing
            role,
            status: UserStatus.ACTIVE,
        });

        // Create associated profile based on role
        let ownerProfile = null;
        let customerProfile = null;

        if (role === UserRole.OWNER && profileData?.ownerProfile) {
            ownerProfile = await this.ownerProfileModel.create({
                userId: user._id,
                ...profileData.ownerProfile,
            });
        }

        if (role === UserRole.CUSTOMER && profileData?.customerProfile) {
            customerProfile = await this.customerProfileModel.create({
                userId: user._id,
                ...profileData.customerProfile,
            });
        }

        // Generate JWT tokens for immediate authentication
        const payload: TokenPayload = {
            sub: user._id.toHexString(),
            email: user.email,
            role: user.role,
        };

        const tokens = await this.tokenService.generateTokenPair(payload);

        this.logger.log(`User registered successfully: ${email} (${role})`);

        // Return minimal user data with tokens (no IDs or unnecessary fields)
        return {
            user: {
                email: user.email,
                role: user.role,
            },
            ...tokens,
        };
    }

    /**
     * Login with email and password
     */
    async login(input: LoginInput) {
        const { email, password, deviceInfo, ipAddress, userAgent } = input;

        // Check brute-force protection
        await this.checkLoginAttempts(email, ipAddress || 'unknown');

        // Find user
        const user = await this.userModel.findOne({ email }).exec();

        if (!user) {
            // Record failed attempt
            await this.recordLoginAttempt(email, ipAddress || 'unknown', userAgent || 'unknown', false);
            throw new AuthenticationError(
                'Invalid credentials',
                ErrorCodes.AUTH_INVALID_CREDENTIALS,
            );
        }

        // Verify password (direct comparison, no hashing)
        const isPasswordValid = password === user.password;

        if (!isPasswordValid) {
            // Record failed attempt
            await this.recordLoginAttempt(email, ipAddress || 'unknown', userAgent || 'unknown', false);
            throw new AuthenticationError(
                'Invalid credentials',
                ErrorCodes.AUTH_INVALID_CREDENTIALS,
            );
        }

        // Check user status
        if (user.status !== UserStatus.ACTIVE) {
            throw new AuthenticationError(
                `Account is ${user.status.toLowerCase()}`,
                ErrorCodes.USER_DEACTIVATED,
            );
        }

        // Record successful attempt
        await this.recordLoginAttempt(email, ipAddress || 'unknown', userAgent || 'unknown', true);

        // Get profile data
        const ownerProfile = await this.ownerProfileModel.findOne({ userId: user._id }).exec();
        const customerProfile = await this.customerProfileModel.findOne({ userId: user._id }).exec();

        // Generate tokens
        const payload: TokenPayload = {
            sub: user._id.toHexString(),
            email: user.email,
            role: user.role,
        };

        const tokens = await this.tokenService.generateTokenPair(
            payload,
            deviceInfo,
            ipAddress,
            userAgent,
        );

        this.logger.log(`User logged in successfully: ${email}`);

        // Remove password from response
        const userObject = user.toObject();
        const { password: _, ...userWithoutPassword } = userObject;

        return {
            user: {
                ...userWithoutPassword,
                id: user._id.toHexString(),
                ownerProfile: ownerProfile?.toObject() || null,
                customerProfile: customerProfile?.toObject() || null,
            },
            ...tokens,
        };
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
        // Verify refresh token and get user ID
        const userId = await this.tokenService.verifyRefreshToken(refreshToken);

        // Get user
        const user = await this.userModel.findById(userId).exec();

        if (!user || user.status !== UserStatus.ACTIVE) {
            throw new AuthenticationError(
                'Invalid user',
                ErrorCodes.AUTH_REFRESH_TOKEN_INVALID,
            );
        }

        // Generate new access token
        const payload: TokenPayload = {
            sub: user._id.toHexString(),
            email: user.email,
            role: user.role,
        };

        const accessToken = this.tokenService.generateAccessToken(payload);

        // Optionally: Implement refresh token rotation
        // Revoke old refresh token and issue new one
        await this.tokenService.revokeRefreshToken(refreshToken);

        this.logger.log(`Access token refreshed for user: ${user.email}`);

        return { accessToken };
    }

    /**
     * Logout user (revoke refresh token)
     */
    async logout(refreshToken: string): Promise<void> {
        await this.tokenService.revokeRefreshToken(refreshToken);
        this.logger.log('User logged out successfully');
    }

    /**
     * Logout from all devices (revoke all user tokens)
     */
    async logoutAll(userId: string): Promise<void> {
        await this.tokenService.revokeAllUserTokens(userId);
        this.logger.log(`User logged out from all devices: ${userId}`);
    }

    /**
     * Validate user by ID (used by JWT strategy)
     */
    async validateUser(userId: string): Promise<UserDocument | null> {
        const user = await this.userModel.findById(userId).exec();

        if (!user || user.status !== UserStatus.ACTIVE) {
            return null;
        }

        return user;
    }

    /**
     * Check if login attempts exceed threshold
     */
    private async checkLoginAttempts(email: string, ipAddress: string): Promise<void> {
        const windowStart = new Date(Date.now() - this.loginAttemptWindow * 1000);

        const failedAttempts = await this.loginAttemptModel.countDocuments({
            identifier: email,
            ipAddress,
            successful: false,
            attemptedAt: { $gte: windowStart },
        }).exec();

        if (failedAttempts >= this.loginAttemptLimit) {
            this.logger.warn(`Too many login attempts for ${email} from ${ipAddress}`);
            throw new RateLimitError(
                'Too many failed login attempts. Please try again later.',
                ErrorCodes.AUTH_TOO_MANY_ATTEMPTS,
                { retryAfter: this.loginAttemptWindow },
            );
        }
    }

    /**
     * Record login attempt
     */
    private async recordLoginAttempt(
        email: string,
        ipAddress: string,
        userAgent: string,
        successful: boolean,
    ): Promise<void> {
        await this.loginAttemptModel.create({
            identifier: email,
            ipAddress,
            userAgent,
            successful,
        });
    }
}
