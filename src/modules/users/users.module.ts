import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './users.controller';
import { UsersService } from './services/users.service';
import { UsersRepository } from './repositories/users.repository';
import { User, UserSchema } from '@infrastructure/database/schemas/user.schema';
import { OwnerProfile, OwnerProfileSchema } from '@infrastructure/database/schemas/owner-profile.schema';
import { CustomerProfile, CustomerProfileSchema } from '@infrastructure/database/schemas/customer-profile.schema';
import { AuthModule } from '@modules/auth/auth.module';

/**
 * Users Module
 * Manages user profiles and account operations
 */
@Module({
    imports: [
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema },
            { name: OwnerProfile.name, schema: OwnerProfileSchema },
            { name: CustomerProfile.name, schema: CustomerProfileSchema },
        ]),
        AuthModule, // For password service and guards
    ],
    controllers: [UsersController],
    providers: [UsersService, UsersRepository],
    exports: [UsersService, UsersRepository],
})
export class UsersModule { }
