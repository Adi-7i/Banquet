import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OwnersController } from './owners.controller';
import { OwnersService } from './services/owners.service';
import { OwnersRepository } from './repositories/owners.repository';
import { OwnerProfile, OwnerProfileSchema } from '@infrastructure/database/schemas/owner-profile.schema';
import { Banquet, BanquetSchema } from '@infrastructure/database/schemas/banquet.schema';
import { AuthModule } from '@modules/auth/auth.module';

/**
 * Owners Module
 * Manages owner profiles and business information
 */
@Module({
    imports: [
        MongooseModule.forFeature([
            { name: OwnerProfile.name, schema: OwnerProfileSchema },
            { name: Banquet.name, schema: BanquetSchema },
        ]),
        AuthModule,
    ],
    controllers: [OwnersController],
    providers: [OwnersService, OwnersRepository],
    exports: [OwnersService, OwnersRepository],
})
export class OwnersModule { }
