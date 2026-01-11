import {
    Controller,
    Get,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './services/users.service';
import { UpdateUserDto, ChangePasswordDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { PaginatedResponseDto } from '@common/dto/pagination.dto';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/guards/roles.guard';
import { Roles } from '@modules/auth/decorators/roles.decorator';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { UserRole } from '@infrastructure/database/schemas/user.schema';

/**
 * Users Controller
 * Handles HTTP requests for user management
 */
@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    /**
     * Get current user profile
     */
    @Get('me')
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({
        status: 200,
        description: 'User profile retrieved successfully',
        type: UserResponseDto,
    })
    async getMyProfile(@CurrentUser() user: any): Promise<UserResponseDto> {
        return this.usersService.getProfile(user.sub);
    }

    /**
     * Update current user profile
     */
    @Patch('me')
    @ApiOperation({ summary: 'Update current user profile' })
    @ApiResponse({
        status: 200,
        description: 'Profile updated successfully',
        type: UserResponseDto,
    })
    async updateMyProfile(
        @CurrentUser() user: any,
        @Body() updateUserDto: UpdateUserDto,
    ): Promise<UserResponseDto> {
        return this.usersService.updateProfile(
            user.sub,
            user.sub,
            user.role,
            updateUserDto,
        );
    }

    /**
     * Change password
     */
    @Patch('me/password')
    @ApiOperation({ summary: 'Change password' })
    @ApiResponse({
        status: 200,
        description: 'Password changed successfully',
    })
    @HttpCode(HttpStatus.OK)
    async changePassword(
        @CurrentUser() user: any,
        @Body() changePasswordDto: ChangePasswordDto,
    ): Promise<{ message: string }> {
        return this.usersService.changePassword(user.sub, changePasswordDto);
    }

    /**
     * List all users (admin only)
     */
    @Get()
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'List all users with filters (admin only)' })
    @ApiResponse({
        status: 200,
        description: 'Users list retrieved successfully',
    })
    async listUsers(
        @Query() query: QueryUserDto,
    ): Promise<PaginatedResponseDto<UserResponseDto>> {
        return this.usersService.listUsers(query);
    }

    /**
     * Get user by ID (admin only)
     */
    @Get(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Get user by ID (admin only)' })
    @ApiResponse({
        status: 200,
        description: 'User retrieved successfully',
        type: UserResponseDto,
    })
    async getUserById(@Param('id') id: string): Promise<UserResponseDto> {
        return this.usersService.getUserById(id);
    }

    /**
     * Update user by ID (admin only)
     */
    @Patch(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Update user by ID (admin only)' })
    @ApiResponse({
        status: 200,
        description: 'User updated successfully',
        type: UserResponseDto,
    })
    async updateUser(
        @Param('id') id: string,
        @CurrentUser() user: any,
        @Body() updateUserDto: UpdateUserDto,
    ): Promise<UserResponseDto> {
        return this.usersService.updateProfile(id, user.sub, user.role, updateUserDto);
    }

    /**
     * Deactivate user (admin only)
     */
    @Delete(':id')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Deactivate user (admin only)' })
    @ApiResponse({
        status: 200,
        description: 'User deactivated successfully',
    })
    @HttpCode(HttpStatus.OK)
    async deactivateUser(
        @Param('id') id: string,
        @CurrentUser() user: any,
    ): Promise<{ message: string }> {
        return this.usersService.deactivateUser(id, user.sub, user.role);
    }
}
