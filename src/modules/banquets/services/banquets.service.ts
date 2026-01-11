import {
    Injectable,
    Logger,
    NotFoundException,
    ForbiddenException,
    BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BanquetsRepository } from '../repositories/banquets.repository';
import { OwnersRepository } from '@modules/owners/repositories/owners.repository';
import { CreateBanquetDto } from '../dto/create-banquet.dto';
import { UpdateBanquetDto } from '../dto/update-banquet.dto';
import { QueryBanquetDto } from '../dto/query-banquet.dto';
import { BanquetResponseDto } from '../dto/banquet-response.dto';
import { PaginatedResponseDto } from '@common/dto/pagination.dto';
import { BanquetStatus } from '@infrastructure/database/schemas/banquet.schema';
import { UserRole } from '@infrastructure/database/schemas/user.schema';

/**
 * Banquets Service
 * Business logic for banquet management
 */
@Injectable()
export class BanquetsService {
    private readonly logger = new Logger(BanquetsService.name);

    constructor(
        private readonly banquetsRepository: BanquetsRepository,
        private readonly ownersRepository: OwnersRepository,
    ) { }

    /**
     * Create banquet (owner only)
     * Business rule: Banquet created as DRAFT by default
     */
    async createBanquet(
        userId: string,
        data: CreateBanquetDto,
    ): Promise<BanquetResponseDto> {
        // Get owner profile
        console.log('===== BANQUET CREATE DEBUG =====');
        console.log(`Looking for owner profile with userId: ${userId}`);
        console.log(`userId type: ${typeof userId}`);

        const owner = await this.ownersRepository.findByUserId(userId);

        console.log(`Owner profile found: ${owner ? 'YES' : 'NO'}`);
        if (owner) {
            console.log(`Owner _id: ${owner._id}`);
            console.log(`Owner userId: ${owner.userId}`);
            console.log(`Owner businessName: ${owner.businessName}`);
        }
        console.log('================================');

        if (!owner) {
            throw new NotFoundException('Owner profile not found');
        }

        // Create banquet as DRAFT
        const banquet = await this.banquetsRepository.create({
            ...data,
            ownerId: owner._id,
            status: BanquetStatus.DRAFT,
            createdBy: userId,
        } as any);

        this.logger.log(`Banquet ${banquet._id} created by owner ${userId}`);

        return BanquetResponseDto.fromDocument(banquet);
    }

    /**
     * Update banquet (owner only, own banquets)
     */
    async updateBanquet(
        banquetId: string,
        userId: string,
        role: UserRole,
        data: UpdateBanquetDto,
    ): Promise<BanquetResponseDto> {
        const banquet = await this.banquetsRepository.findById(banquetId);

        if (!banquet) {
            throw new NotFoundException('Banquet not found');
        }

        // Authorization: owner can only update their own banquets (unless admin)
        const owner = await this.ownersRepository.findByUserId(userId);
        if (role !== UserRole.ADMIN && banquet.ownerId.toHexString() !== owner?._id.toHexString()) {
            throw new ForbiddenException('You can only update your own banquets');
        }

        const updated = await this.banquetsRepository.update(banquetId, {
            ...data,
            updatedBy: userId,
        } as any);

        if (!updated) {
            throw new NotFoundException('Banquet not found');
        }

        this.logger.log(`Banquet ${banquetId} updated by ${userId}`);

        return BanquetResponseDto.fromDocument(updated);
    }

    /**
     * Publish banquet (change status from DRAFT to PUBLISHED)
     * Business rule: Requires all mandatory fields
     */
    async publishBanquet(
        banquetId: string,
        userId: string,
    ): Promise<BanquetResponseDto> {
        const banquet = await this.banquetsRepository.findById(banquetId);

        if (!banquet) {
            throw new NotFoundException('Banquet not found');
        }

        // Check ownership
        const owner = await this.ownersRepository.findByUserId(userId);
        if (banquet.ownerId.toHexString() !== owner?._id.toHexString()) {
            throw new ForbiddenException('You can only publish your own banquets');
        }

        // Validate required fields
        if (!banquet.name || !banquet.address || !banquet.city || !banquet.capacity || !banquet.pricing) {
            throw new BadRequestException('Cannot publish incomplete banquet. Required: name, address, city, capacity, pricing');
        }

        const updated = await this.banquetsRepository.updateStatus(banquetId, BanquetStatus.PUBLISHED);

        this.logger.log(`Banquet ${banquetId} published by ${userId}`);

        return BanquetResponseDto.fromDocument(updated!);
    }

    /**
     * Unpublish banquet (PUBLISHED → UNAVAILABLE)
     */
    async unpublishBanquet(
        banquetId: string,
        userId: string,
    ): Promise<BanquetResponseDto> {
        const banquet = await this.banquetsRepository.findById(banquetId);

        if (!banquet) {
            throw new NotFoundException('Banquet not found');
        }

        const owner = await this.ownersRepository.findByUserId(userId);
        if (banquet.ownerId.toHexString() !== owner?._id.toHexString()) {
            throw new ForbiddenException('You can only unpublish your own banquets');
        }

        const updated = await this.banquetsRepository.updateStatus(banquetId, BanquetStatus.UNAVAILABLE);

        this.logger.log(`Banquet ${banquetId} unpublished by ${userId}`);

        return BanquetResponseDto.fromDocument(updated!);
    }

    /**
     * Delete banquet (soft delete, owner only)
     */
    async deleteBanquet(
        banquetId: string,
        userId: string,
    ): Promise<{ message: string }> {
        const banquet = await this.banquetsRepository.findById(banquetId);

        if (!banquet) {
            throw new NotFoundException('Banquet not found');
        }

        const owner = await this.ownersRepository.findByUserId(userId);
        if (banquet.ownerId.toHexString() !== owner?._id.toHexString()) {
            throw new ForbiddenException('You can only delete your own banquets');
        }

        await this.banquetsRepository.softDelete(banquetId, userId);

        this.logger.log(`Banquet ${banquetId} deleted by ${userId}`);

        return { message: 'Banquet deleted successfully' };
    }

    /**
     * Search banquets (public, published only)
     */
    async searchBanquets(query: QueryBanquetDto): Promise<PaginatedResponseDto<BanquetResponseDto>> {
        const { search, city, status, minCapacity, maxCapacity, latitude, longitude, radiusKm, ...paginationOptions } = query;

        // Build filter - only PUBLISHED for public search
        const filter: any = { status: BanquetStatus.PUBLISHED };

        if (search) {
            filter.$text = { $search: search };
        }

        if (city) {
            filter.city = { $regex: city, $options: 'i' };
        }

        if (minCapacity !== undefined || maxCapacity !== undefined) {
            filter.capacity = {};
            if (minCapacity) filter.capacity.$gte = minCapacity;
            if (maxCapacity) filter.capacity.$lte = maxCapacity;
        }

        // TODO: Implement geospatial search if lat/lng/radius provided

        const result = await this.banquetsRepository.findAll(filter, paginationOptions);

        const banquets = BanquetResponseDto.fromDocuments(result.data);

        return new PaginatedResponseDto(banquets, result.pagination);
    }

    /**
     * Get my banquets (owner)
     */
    async getMyBanquets(
        userId: string,
        status?: BanquetStatus,
    ): Promise<BanquetResponseDto[]> {
        const owner = await this.ownersRepository.findByUserId(userId);

        if (!owner) {
            throw new NotFoundException('Owner profile not found');
        }

        const banquets = await this.banquetsRepository.findByOwnerId(
            owner._id.toHexString(),
            status,
        );

        return BanquetResponseDto.fromDocuments(banquets);
    }

    /**
     * Get banquet by ID
     * Business rule: Public if PUBLISHED, owner can see own drafts
     */
    async getBanquetById(
        banquetId: string,
        userId?: string,
    ): Promise<BanquetResponseDto> {
        const banquet = await this.banquetsRepository.findById(banquetId);

        if (!banquet) {
            throw new NotFoundException('Banquet not found');
        }

        // If not published, only owner can view
        if (banquet.status !== BanquetStatus.PUBLISHED) {
            if (!userId) {
                throw new NotFoundException('Banquet not found');
            }

            const owner = await this.ownersRepository.findByUserId(userId);
            if (banquet.ownerId.toHexString() !== owner?._id.toHexString()) {
                throw new NotFoundException('Banquet not found');
            }
        }

        return BanquetResponseDto.fromDocument(banquet);
    }
}
