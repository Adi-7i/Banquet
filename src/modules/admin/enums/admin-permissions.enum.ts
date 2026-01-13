/**
 * Admin Permissions
 * Fine-grained permission system for admin actions
 */
export enum AdminPermission {
    // User Management
    MANAGE_USERS = 'manage_users',

    // Owner Management
    MANAGE_OWNERS = 'manage_owners',

    // Banquet Management
    MANAGE_BANQUETS = 'manage_banquets',

    // Booking Management
    MANAGE_BOOKINGS = 'manage_bookings',

    // Review Moderation
    MANAGE_REVIEWS = 'manage_reviews',

    // Featured Listings
    MANAGE_FEATURED = 'manage_featured',

    // Platform Settings
    MANAGE_SETTINGS = 'manage_settings',

    // Analytics & Dashboard
    VIEW_ANALYTICS = 'view_analytics',

    // Support Tickets
    MANAGE_SUPPORT = 'manage_support',

    // Super Admin - All permissions
    SUPER_ADMIN = 'super_admin',
}

/**
 * Default permission sets for admin levels
 */
export const ADMIN_PERMISSION_SETS = {
    // Basic support staff
    SUPPORT_AGENT: [
        AdminPermission.VIEW_ANALYTICS,
        AdminPermission.MANAGE_SUPPORT,
    ],

    // Content moderator
    MODERATOR: [
        AdminPermission.VIEW_ANALYTICS,
        AdminPermission.MANAGE_REVIEWS,
        AdminPermission.MANAGE_SUPPORT,
    ],

    // Full admin (no settings)
    ADMIN: [
        AdminPermission.MANAGE_USERS,
        AdminPermission.MANAGE_OWNERS,
        AdminPermission.MANAGE_BANQUETS,
        AdminPermission.MANAGE_BOOKINGS,
        AdminPermission.MANAGE_REVIEWS,
        AdminPermission.MANAGE_FEATURED,
        AdminPermission.VIEW_ANALYTICS,
        AdminPermission.MANAGE_SUPPORT,
    ],

    // Super admin - all permissions
    SUPER_ADMIN: [
        AdminPermission.SUPER_ADMIN,
    ],
};

/**
 * Check if permission set includes required permission
 */
export function hasPermission(
    userPermissions: AdminPermission[],
    requiredPermission: AdminPermission,
): boolean {
    // Super admin has all permissions
    if (userPermissions.includes(AdminPermission.SUPER_ADMIN)) {
        return true;
    }
    return userPermissions.includes(requiredPermission);
}
