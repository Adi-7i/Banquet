import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

/**
 * Bull Queue Module
 * Provides BullMQ queue infrastructure for async job processing
 */
@Global()
@Module({
    imports: [
        BullModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                connection: {
                    host: config.get<string>('REDIS_HOST') || 'localhost',
                    port: config.get<number>('REDIS_PORT') || 6379,
                },
            }),
        }),
        BullModule.registerQueue(
            { name: 'booking-confirmation' },
            { name: 'booking-notification' },
            { name: 'payment-processing' },
        ),
    ],
    exports: [BullModule],
})
export class QueueModule { }
