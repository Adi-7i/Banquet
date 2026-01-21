import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { IS_OPTIONAL_AUTH_KEY } from '../decorators/optional-auth.decorator';

/**
 * Optional JWT Authentication Guard
 * - Extracts user from JWT token if present
 * - Does NOT fail if token is missing
 * - Used for endpoints that work both public and authenticated
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
    constructor(private reflector: Reflector) {
        super();
    }

    canActivate(context: ExecutionContext) {
        // Check if endpoint is marked as public (skip all auth)
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isPublic) {
            return true;
        }

        // Check if endpoint is marked as optional auth
        const isOptionalAuth = this.reflector.getAllAndOverride<boolean>(IS_OPTIONAL_AUTH_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (isOptionalAuth) {
            // Proceed with JWT validation but don't fail if no token
            return super.canActivate(context);
        }

        // For all other endpoints, proceed with normal JWT validation
        return super.canActivate(context);
    }

    handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
        // Check if this is an optional auth endpoint
        const isOptionalAuth = this.reflector.getAllAndOverride<boolean>(IS_OPTIONAL_AUTH_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // For optional auth, return user if available, undefined if not
        // Don't throw an error for missing/invalid tokens
        if (isOptionalAuth) {
            return user || undefined;
        }

        // For required auth, throw error if no user
        if (err || !user) {
            throw err || new Error('Invalid or missing authentication token');
        }

        return user;
    }
}
