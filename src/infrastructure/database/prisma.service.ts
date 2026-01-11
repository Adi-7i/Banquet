import {
    Injectable,
    OnModuleInit,
    OnModuleDestroy,
    Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

/**
 * Prisma Service
 * Extends PrismaClient with NestJS lifecycle hooks and soft delete middleware
 */
@Injectable()
export class PrismaService
    extends PrismaClient
    implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name);

    constructor(private configService: ConfigService) {
        const isDevelopment = configService.get('app.env') === 'development';

        super({
            log: isDevelopment
                ? ['query', 'info', 'warn', 'error']
                : ['warn', 'error'],
            errorFormat: 'pretty',
        });

        // Soft delete middleware - automatically filter out soft-deleted records
        this.$use(async (params: any, next: any) => {
            // Check for soft delete timestamp
            if (params.action === 'delete') {
                // Convert delete to update with deletedAt timestamp
                params.action = 'update';
                params.args['data'] = { deletedAt: new Date() };
            }

            if (params.action === 'deleteMany') {
                // Convert deleteMany to updateMany with deletedAt timestamp
                params.action = 'updateMany';
                if (params.args.data !== undefined) {
                    params.args.data['deletedAt'] = new Date();
                } else {
                    params.args['data'] = { deletedAt: new Date() };
                }
            }

            // Automatically filter out soft-deleted records in queries
            if (params.action === 'findUnique' || params.action === 'findFirst') {
                params.action = 'findFirst';
                params.args.where = {
                    ...params.args.where,
                    deletedAt: null,
                };
            }

            if (params.action === 'findMany') {
                if (params.args.where) {
                    if (params.args.where.deletedAt === undefined) {
                        params.args.where['deletedAt'] = null;
                    }
                } else {
                    params.args['where'] = { deletedAt: null };
                }
            }

            return next(params);
        });
    }

    async onModuleInit() {
        try {
            await this.$connect();
            this.logger.log('✅ Database connection established');
        } catch (error) {
            this.logger.error('❌ Failed to connect to database', error);
            throw error;
        }
    }

    async onModuleDestroy() {
        await this.$disconnect();
        this.logger.log('Database connection closed');
    }

    /**
     * Hard delete - permanently remove record from database
     * Use with caution!
     */
    async hardDelete<T>(model: string, where: any): Promise<T> {
        return (this as any)[model].delete({ where });
    }

    /**
     * Restore soft-deleted record
     */
    async restore<T>(model: string, where: any): Promise<T> {
        return (this as any)[model].update({
            where,
            data: { deletedAt: null },
        });
    }

    /**
     * Clean database connection for graceful shutdown
     */
    async enableShutdownHooks() {
        process.on('beforeExit', async () => {
            await this.$disconnect();
        });
    }
}
