import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { DatabaseModule } from '@infrastructure/database/database.module';
import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { PasswordService } from './services/password.service';
import { TokenService } from './services/token.service';
import { OtpService } from './services/otp.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from './guards/optional-jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';

/**
 * Authentication Module
 * Provides authentication and authorization features
 */
@Module({
    imports: [
        DatabaseModule,
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('security.jwt.accessSecret') || 'default-secret',
                signOptions: {
                    expiresIn: 900, // 15 minutes in seconds
                },
            }),
        }),
    ],
    controllers: [AuthController],
    providers: [
        AuthService,
        PasswordService,
        TokenService,
        OtpService,
        JwtStrategy,
        JwtAuthGuard,
        OptionalJwtAuthGuard,
        RolesGuard,
        PermissionsGuard,
    ],
    exports: [
        AuthService,
        PasswordService,
        TokenService,
        JwtAuthGuard,
        OptionalJwtAuthGuard,
        RolesGuard,
        PermissionsGuard,
    ],
})
export class AuthModule { }
