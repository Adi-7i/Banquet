import {
    Injectable,
    Logger,
    NotFoundException,
    ForbiddenException,
    ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { OwnersRepository } from '../repositories/owners.repository';
import { UpdateOwnerDto } from '../dto/update-owner.dto';
import { QueryOwnerDto } from '../dto/query-owner.dto';
import { OwnerResponseDto } from '../dto/owner-response.dto';
import { PaginatedResponseDto } from '@common/dto/pagination.dto';
import { Banquet, BanquetDocument } from '@infrastructure/database/schemas/banquet.schema';
import { UserRole } from '@infrastructure/database/schemas/user.schema';

/**
 * Owners Service
 * Business logic for owner profile management
 */
@Injectable()
export class OwnersService {
    private readonly logger = new Logger(OwnersService.name);

    constructor(
        private readonly ownersRepository: OwnersRepository,
        @InjectModel(Banquet.name) private banquetModel: Model<BanquetDocument>,
    ) { }

    /**
     * Get owner profile by user ID
     */
    async getOwnerProfile(userId: string): Promise<OwnerResponseDto> {
        const owner = await this.ownersRepository.findByUserId(userId);

        if (!owner) {
            throw new NotFoundException('Owner profile not found');
        }

        return OwnerResponseDto.fromDocument(owner);
    }

    /**
     * Get owner profile with banquets
     */
    async getOwnerWithBanquets(ownerId: string): Promise<OwnerResponseDto> {
        const owner = await this.ownersRepository.findById(ownerId);

        if (!owner) {
            throw new NotFoundException('Owner profile not found');
        }

        // Fetch owner's banquets
        const banquets = await this.banquetModel
            .find({ ownerId: owner._id, deletedAt: null })
            .lean()
            .exec();

        const ownerWithBanquets = {
            ...owner.toObject(),
            banquets,
        };

        return OwnerResponseDto.fromDocument(ownerWithBanquets);
    }

    /**
     * Update owner profile
     * Business rule: Owners can only update their own profile
     */
    async updateOwnerProfile(
        userId: string,
        requestingUserId: string,
        requestingUserRole: UserRole,
        data: UpdateOwnerDto,
    ): Promise<OwnerResponseDto> {
        // Authorization: only the owner themselves or admins can update
        if (userId !== requestingUserId && requestingUserRole !== UserRole.ADMIN) {
            throw new ForbiddenException('You can only update your own profile');
        }

        const owner = await this.ownersRepository.findByUserId(userId);

        if (!owner) {
            throw new NotFoundException('Owner profile not found');
        }

        // Check if business name is being changed and if it's available
        if (data.businessName && data.businessName !== owner.businessName) {
            const nameExists = await this.ownersRepository.businessNameExists(
                data.businessName,
                userId,
            );

            if (nameExists) {
                throw new ConflictException('Business name already in use');
            }
        }

        // Update owner profile
        const updatedOwner = await this.ownersRepository.updateOwnerProfile(userId, {
            ...data,
            updatedBy: requestingUserId,
        } as any);

        if (!updatedOwner) {
            throw new NotFoundException('Owner profile not found');
        }

        this.logger.log(`Owner profile ${owner._id} updated by ${requestingUserId}`);

        return OwnerResponseDto.fromDocument(updatedOwner);
    }

    /**
     * List all owners (public endpoint with pagination)
     */
    async listOwners(query: QueryOwnerDto): Promise<PaginatedResponseDto<OwnerResponseDto>> {
        const { search, city, ...paginationOptions } = query;

        // Build filter
        const filter: any = {};

        if (search) {
            filter.$or = [
                { businessName: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        if (city) {
            filter.city = { $regex: city, $options: 'i' };
        }

        const result = await this.ownersRepository.findAll(filter, paginationOptions);

        const owners = OwnerResponseDto.fromDocuments(result.data);

        return new PaginatedResponseDto(owners, result.pagination);
    }

    /**
     * Get public owner profile by ID (with banquets)
     */
    async getPublicOwnerProfile(ownerId: string): Promise<OwnerResponseDto> {
        return this.getOwnerWithBanquets(ownerId);
    }
}
