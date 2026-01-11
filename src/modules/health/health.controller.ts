import { Controller, Get } from '@nestjs/common';
import {
    HealthCheck,
    HealthCheckService,
    PrismaHealthIndicator,
    MemoryHealthIndicator,
    DiskHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

/**
 * Health Check Controller
 * Provides endpoints to monitor application and infrastructure health
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
    constructor(
        private health: HealthCheckService,
        private prismaHealth: PrismaHealthIndicator,
        private memoryHealth: MemoryHealthIndicator,
        private diskHealth: DiskHealthIndicator,
        private prismaService: PrismaService,
    ) { }

    /**
     * Overall health check
     * Returns status of all critical services
     */
    @Get()
    @HealthCheck()
    @ApiOperation({ summary: 'Check overall application health' })
    check() {
        return this.health.check([
            () => this.prismaHealth.pingCheck('database', this.prismaService),
            () =>
                this.memoryHealth.checkHeap('memory_heap', 300 * 1024 * 1024), // 300MB
            () =>
                this.diskHealth.checkStorage('disk', {
                    path: '/',
                    thresholdPercent: 0.9, // 90%
                }),
        ]);
    }

    /**
     * Database health check
     */
    @Get('db')
    @HealthCheck()
    @ApiOperation({ summary: 'Check database connectivity' })
    checkDatabase() {
        return this.health.check([
            () => this.prismaHealth.pingCheck('database', this.prismaService),
        ]);
    }

    /**
     * Memory health check
     */
    @Get('memory')
    @HealthCheck()
    @ApiOperation({ summary: 'Check memory usage' })
    checkMemory() {
        return this.health.check([
            () =>
                this.memoryHealth.checkHeap('memory_heap', 300 * 1024 * 1024),
            () =>
                this.memoryHealth.checkRSS('memory_rss', 300 * 1024 * 1024),
        ]);
    }

    /**
     * Disk health check
     */
    @Get('disk')
    @HealthCheck()
    @ApiOperation({ summary: 'Check disk space' })
    checkDisk() {
        return this.health.check([
            () =>
                this.diskHealth.checkStorage('disk', {
                    path: '/',
                    thresholdPercent: 0.9,
                }),
        ]);
    }
}
