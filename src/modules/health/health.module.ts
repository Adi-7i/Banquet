import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';

/**
 * Health Module
 * Provides health check endpoints for monitoring
 */
@Module({
    imports: [TerminusModule],
    controllers: [HealthController],
})
export class HealthModule { }
