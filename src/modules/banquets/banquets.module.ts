import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BanquetsController } from './banquets.controller';
import { BanquetsService } from './services/banquets.service';
import { BanquetsRepository } from './repositories/banquets.repository';
import { Banquet, BanquetSchema } from '@infrastructure/database/schemas/banquet.schema';
import { OwnersModule } from '@modules/owners/owners.module';
import { AuthModule } from '@modules/auth/auth.module';

/**
 * Banquets Module
 * Manages banquet listings and CRUD operations
 */
@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Banquet.name, schema: BanquetSchema },
        ]),
        OwnersModule, // For owner verification
        AuthModule,
    ],
    controllers: [BanquetsController],
    providers: [BanquetsService, BanquetsRepository],
    exports: [BanquetsService, BanquetsRepository],
})
export class BanquetsModule { }
