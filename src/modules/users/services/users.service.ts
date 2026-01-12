import {
    Injectable,
    Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsersRepository } from '../repositories/users.repository';
import { UpdateUserDto, ChangePasswordDto } from '../dto/update-user.dto';
import { QueryUserDto } from '../dto/query-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { PaginatedResponseDto } from '@common/dto/pagination.dto';
import { OwnerProfile, OwnerProfileDocument } from '@infrastructure/database/schemas/owner-profile.schema';
import { CustomerProfile, CustomerProfileDocument } from '@infrastructure/database/schemas/customer-profile.schema';
import { UserRole } from '@infrastructure/database/schemas/user.schema';
import { PasswordService } from '@modules/auth/services/password.service';
import {
    NotFoundError,
    AuthorizationError,
    ConflictError,
    ValidationError,
} from '@common/errors';
import { ErrorCodes } from '@common/errors';

/**
 * Users Service
 * Business logic for user management
 */
@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);

    constructor(
        private readonly usersRepository: UsersRepository,
        @InjectModel(OwnerProfile.name) private ownerProfileModel: Model<OwnerProfileDocument>,
        @InjectModel(CustomerProfile.name) private customerProfileModel: Model<CustomerProfileDocument>,
        private readonly passwordService: PasswordService,
    ) { }

    /**
     * Get user profile (with related profile data)
     */
    async getProfile(userId: string): Promise<UserResponseDto> {
        const user = await this.usersRepository.findById(userId);

        if (!user) {
            throw new NotFoundError(
                'User not found',
                ErrorCodes.USER_NOT_FOUND,
            );
        }

        // Fetch profile based on role
        let profileData = null;

        if (user.role === UserRole.OWNER) {
            profileData = await this.ownerProfileModel.findOne({ userId: user._id }).lean().exec();
        } else if (user.role === UserRole.CUSTOMER) {
            profileData = await this.customerProfileModel.findOne({ userId: user._id }).lean().exec();
        }

        const userWithProfile = {
            ...user.toObject(),
            ownerProfile: user.role === UserRole.OWNER ? profileData : null,
            customerProfile: user.role === UserRole.CUSTOMER ? profileData : null,
        };

        return UserResponseDto.fromDocument(userWithProfile);
    }

    /**
     * Update user profile
     * Business rule: Users can only update their own profile (except admins)
     */
    async updateProfile(
        userId: string,
        requestingUserId: string,
        requestingUserRole: UserRole,
        data: UpdateUserDto,
    ): Promise<UserResponseDto> {
        // Authorization check: only admins can update other users
        if (userId !== requestingUserId && requestingUserRole !== UserRole.ADMIN) {
            throw new AuthorizationError(
                'You can only update your own profile',
                ErrorCodes.AUTHZ_INSUFFICIENT_PERMISSIONS,
            );
        }

        // Check if user exists
        const user = await this.usersRepository.findById(userId);
        if (!user) {
            throw new NotFoundError(
                'User not found',
                ErrorCodes.USER_NOT_FOUND,
            );
        }

        // Check if email is being changed and if it's available
        if (data.email && data.email !== user.email) {
            const emailExists = await this.usersRepository.emailExists(data.email, userId);
            if (emailExists) {
                throw new ConflictError(
                    'Email already in use',
                    ErrorCodes.USER_EMAIL_EXISTS,
                );
            }
        }

        // Update user
        const updatedUser = await this.usersRepository.update(userId, {
            ...data,
            updatedBy: requestingUserId,
        } as any);

        if (!updatedUser) {
            throw new NotFoundError(
                'User not found',
                ErrorCodes.USER_NOT_FOUND,
            );
        }

        this.logger.log(`User ${userId} updated by ${requestingUserId}`);

        return this.getProfile(userId);
    }

    /**
     * Change user password
     */
    async changePassword(
        userId: string,
        data: ChangePasswordDto,
    ): Promise<{ message: string }> {
        const user = await this.usersRepository.findById(userId);

        if (!user) {
            throw new NotFoundError(
                'User not found',
                ErrorCodes.USER_NOT_FOUND,
            );
        }

        // Verify current password
        const isPasswordValid = await this.passwordService.verifyPassword(
            data.currentPassword,
            user.password,
        );

        if (!isPasswordValid) {
            throw new ValidationError(
                'Current password is incorrect',
                [{ field: 'currentPassword', message: 'Password is incorrect' }],
                ErrorCodes.USER_PASSWORD_MISMATCH,
            );
        }

        // Validate new password strength
        const passwordValidation = this.passwordService.validatePasswordStrength(data.newPassword);
        if (!passwordValidation.isValid) {
            throw new ValidationError(
                'New password does not meet security requirements',
                passwordValidation.errors?.map(e => ({ field: 'newPassword', message: e })),
                ErrorCodes.USER_INVALID_PASSWORD,
            );
        }

        // Hash and update new password
        const hashedPassword = await this.passwordService.hashPassword(data.newPassword);
        await this.usersRepository.updatePassword(userId, hashedPassword);

        this.logger.log(`Password changed for user ${userId}`);

        return { message: 'Password changed successfully' };
    }

    /**
     * List users with pagination and filters (admin only)
     */
    async listUsers(query: QueryUserDto): Promise<PaginatedResponseDto<UserResponseDto>> {
        const { search, role, status, ...paginationOptions } = query;

        // Build filter
        const filter: any = {};

        if (search) {
            filter.email = { $regex: search, $options: 'i' };
        }

        if (role) {
            filter.role = role;
        }

        if (status) {
            filter.status = status;
        }

        const result = await this.usersRepository.findAll(filter, paginationOptions);

        const users = UserResponseDto.fromDocuments(result.data);

        return new PaginatedResponseDto(users, result.pagination);
    }

    /**
     * Get user by ID (admin only)
     */
    async getUserById(userId: string): Promise<UserResponseDto> {
        return this.getProfile(userId);
    }

    /**
     * Deactivate user (soft delete)
     * Business rule: Users cannot deactivate themselves, only admins
     */
    async deactivateUser(
        userId: string,
        requestingUserId: string,
        requestingUserRole: UserRole,
    ): Promise<{ message: string }> {
        // Business rule: users cannot deactivate themselves
        if (userId === requestingUserId) {
            throw new AuthorizationError(
                'You cannot deactivate your own account',
                ErrorCodes.AUTHZ_FORBIDDEN,
            );
        }

        // Only admins can deactivate users
        if (requestingUserRole !== UserRole.ADMIN) {
            throw new AuthorizationError(
                'Only admins can deactivate users',
                ErrorCodes.AUTHZ_ROLE_REQUIRED,
            );
        }

        const user = await this.usersRepository.findById(userId);
        if (!user) {
            throw new NotFoundError(
                'User not found',
                ErrorCodes.USER_NOT_FOUND,
            );
        }

        await this.usersRepository.softDelete(userId, requestingUserId);

        this.logger.log(`User ${userId} deactivated by ${requestingUserId}`);

        return { message: 'User deactivated successfully' };
    }
}
