import { SetMetadata } from '@nestjs/common';
import { AdminPermission } from '../enums/admin-permissions.enum';

/**
 * Decorator to specify required admin permissions for an endpoint
 */
export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: AdminPermission[]) =>
    SetMetadata(PERMISSIONS_KEY, permissions);
