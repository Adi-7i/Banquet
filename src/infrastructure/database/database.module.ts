import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from './database.service';
import { TransactionManager } from './transaction.manager';

// Import all schemas
import { User, UserSchema } from './schemas/user.schema';
import { OwnerProfile, OwnerProfileSchema } from './schemas/owner-profile.schema';
import { CustomerProfile, CustomerProfileSchema } from './schemas/customer-profile.schema';
import { Banquet, BanquetSchema } from './schemas/banquet.schema';
import { RefreshToken, RefreshTokenSchema } from './schemas/refresh-token.schema';
import { OtpVerification, OtpVerificationSchema } from './schemas/otp-verification.schema';
import { LoginAttempt, LoginAttemptSchema } from './schemas/login-attempt.schema';

/**
 * Global Database Module
 * Provides Mongoose connection and model schemas throughout the application
 */
@Global()
@Module({
    imports: [
        MongooseModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                uri: config.get<string>('database.uri'),
                // Connection options
                retryWrites: true,
                w: 'majority',
            }),
        }),
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema },
            { name: OwnerProfile.name, schema: OwnerProfileSchema },
            { name: CustomerProfile.name, schema: CustomerProfileSchema },
            { name: Banquet.name, schema: BanquetSchema },
            { name: RefreshToken.name, schema: RefreshTokenSchema },
            { name: OtpVerification.name, schema: OtpVerificationSchema },
            { name: LoginAttempt.name, schema: LoginAttemptSchema },
        ]),
    ],
    providers: [DatabaseService, TransactionManager],
    exports: [MongooseModule, DatabaseService, TransactionManager],
})
export class DatabaseModule { }
