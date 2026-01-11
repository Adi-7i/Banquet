import {
    Injectable,
    Logger,
    NotFoundException,
    ConflictException,
    ForbiddenException,
    BadRequestException,
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
            throw new NotFoundException('User not found');
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
            throw new ForbiddenException('You can only update your own profile');
        }

        // Check if user exists
        const user = await this.usersRepository.findById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Check if email is being changed and if it's available
        if (data.email && data.email !== user.email) {
            const emailExists = await this.usersRepository.emailExists(data.email, userId);
            if (emailExists) {
                throw new ConflictException('Email already in use');
            }
        }

        // Update user
        const updatedUser = await this.usersRepository.update(userId, {
            ...data,
            updatedBy: requestingUserId,
        } as any);

        if (!updatedUser) {
            throw new NotFoundException('User not found');
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
            throw new NotFoundException('User not found');
        }

        // Verify current password
        const isPasswordValid = await this.passwordService.verifyPassword(
            data.currentPassword,
            user.password,
        );

        if (!isPasswordValid) {
            throw new BadRequestException('Current password is incorrect');
        }

        // Validate new password strength
        const passwordValidation = this.passwordService.validatePasswordStrength(data.newPassword);
        if (!passwordValidation.isValid) {
            throw new BadRequestException({
                message: 'New password does not meet security requirements',
                errors: passwordValidation.errors,
            });
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
            throw new ForbiddenException('You cannot deactivate your own account');
        }

        // Only admins can deactivate users
        if (requestingUserRole !== UserRole.ADMIN) {
            throw new ForbiddenException('Only admins can deactivate users');
        }

        const user = await this.usersRepository.findById(userId);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        await this.usersRepository.softDelete(userId, requestingUserId);

        this.logger.log(`User ${userId} deactivated by ${requestingUserId}`);

        return { message: 'User deactivated successfully' };
    }
}
