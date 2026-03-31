import { SetMetadata } from '@nestjs/common';

/**
 * Optional Auth Decorator
 * Marks an endpoint as optionally authenticated
 * - Extracts user if token is present
 * - Allows access even if token is missing
 * - Used for endpoints that work both public and authenticated
 */
export const IS_OPTIONAL_AUTH_KEY = 'isOptionalAuth';
export const OptionalAuth = () => SetMetadata(IS_OPTIONAL_AUTH_KEY, true);
