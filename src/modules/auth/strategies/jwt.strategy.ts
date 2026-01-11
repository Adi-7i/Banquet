import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../services/auth.service';
import { TokenPayload } from '../services/token.service';

/**
 * JWT Strategy
 * Validates JWT access tokens and loads user data
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    private readonly logger = new Logger(JwtStrategy.name);

    constructor(
        private configService: ConfigService,
        private authService: AuthService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('security.jwt.accessSecret') || 'default-secret',
        });
    }

    /**
     * Validate JWT payload and return user
     * This method is called automatically by Passport after token verification
     */
    async validate(payload: TokenPayload) {
        const user = await this.authService.validateUser(payload.sub);

        if (!user) {
            this.logger.warn(`Invalid user in token: ${payload.sub}`);
            throw new UnauthorizedException('Invalid user or inactive account');
        }

        // Return structured object with sub for consistency
        // This allows controllers to use user.sub (userId string)
        return {
            sub: user._id.toHexString(),
            email: user.email,
            role: user.role,
            status: user.status,
        };
    }
}

