import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminPermission, hasPermission, ADMIN_PERMISSION_SETS } from '../enums/admin-permissions.enum';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { UserRole } from '@infrastructure/database/schemas/user.schema';

/**
 * Guard to check admin permissions
 */
@Injectable()
export class AdminPermissionsGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredPermissions = this.reflector.getAllAndOverride<AdminPermission[]>(
            PERMISSIONS_KEY,
            [context.getHandler(), context.getClass()],
        );

        // No specific permissions required
        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new ForbiddenException('User not authenticated');
        }

        // Must be admin
        if (user.role !== UserRole.ADMIN) {
            throw new ForbiddenException('Admin access required');
        }

        // Get user's permissions (from user object or default based on admin level)
        const userPermissions = this.getUserPermissions(user);

        // Check if user has all required permissions
        const hasAllPermissions = requiredPermissions.every(permission =>
            hasPermission(userPermissions, permission),
        );

        if (!hasAllPermissions) {
            throw new ForbiddenException('Insufficient admin permissions');
        }

        return true;
    }

    private getUserPermissions(user: any): AdminPermission[] {
        // If user has custom permissions defined
        if (user.adminPermissions && Array.isArray(user.adminPermissions)) {
            return user.adminPermissions;
        }

        // Default: give super admin permissions to all admins for now
        // In production, this would be based on user's admin level
        return ADMIN_PERMISSION_SETS.SUPER_ADMIN;
    }
}
