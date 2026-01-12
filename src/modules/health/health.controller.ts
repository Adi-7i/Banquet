import { Controller, Get } from '@nestjs/common';
import {
    HealthCheck,
    HealthCheckService,
    MongooseHealthIndicator,
    MemoryHealthIndicator,
    DiskHealthIndicator,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

/**
 * Health Check Controller
 * Provides endpoints to monitor application and infrastructure health
 * Includes Kubernetes-compatible liveness and readiness probes
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
    private readonly startTime: Date;

    constructor(
        private health: HealthCheckService,
        private mongooseHealth: MongooseHealthIndicator,
        private memoryHealth: MemoryHealthIndicator,
        private diskHealth: DiskHealthIndicator,
        private configService: ConfigService,
    ) {
        this.startTime = new Date();
    }

    /**
     * Overall health check
     * Returns status of all critical services with app metadata
     */
    @Get()
    @HealthCheck()
    @ApiOperation({ summary: 'Check overall application health' })
    @ApiResponse({ status: 200, description: 'Application is healthy' })
    @ApiResponse({ status: 503, description: 'Application is unhealthy' })
    async check() {
        const healthResult = await this.health.check([
            () => this.mongooseHealth.pingCheck('mongodb'),
            () =>
                this.memoryHealth.checkHeap('memory_heap', 300 * 1024 * 1024), // 300MB
            () =>
                this.diskHealth.checkStorage('disk', {
                    path: '/',
                    thresholdPercent: 0.9, // 90%
                }),
        ]);

        return {
            ...healthResult,
            app: {
                name: this.configService.get<string>('app.name'),
                version: this.configService.get<string>('app.version'),
                environment: this.configService.get<string>('app.env'),
                uptime: this.getUptime(),
                timestamp: new Date().toISOString(),
            },
        };
    }

    /**
     * Kubernetes liveness probe
     * Returns 200 if the application is running (even if dependencies are down)
     */
    @Get('live')
    @ApiOperation({ summary: 'Kubernetes liveness probe' })
    @ApiResponse({ status: 200, description: 'Application is alive' })
    checkLiveness() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: this.getUptime(),
        };
    }

    /**
     * Kubernetes readiness probe
     * Returns 200 only if all dependencies are healthy and app can serve traffic
     */
    @Get('ready')
    @HealthCheck()
    @ApiOperation({ summary: 'Kubernetes readiness probe' })
    @ApiResponse({ status: 200, description: 'Application is ready to serve traffic' })
    @ApiResponse({ status: 503, description: 'Application is not ready' })
    checkReadiness() {
        return this.health.check([
            () => this.mongooseHealth.pingCheck('mongodb'),
        ]);
    }

    /**
     * Database health check
     */
    @Get('db')
    @HealthCheck()
    @ApiOperation({ summary: 'Check database connectivity' })
    @ApiResponse({ status: 200, description: 'Database is healthy' })
    @ApiResponse({ status: 503, description: 'Database is unhealthy' })
    checkDatabase() {
        return this.health.check([
            () => this.mongooseHealth.pingCheck('mongodb'),
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

    /**
     * Calculate application uptime
     */
    private getUptime(): string {
        const uptimeMs = Date.now() - this.startTime.getTime();
        const seconds = Math.floor(uptimeMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days}d ${hours % 24}h ${minutes % 60}m`;
        }
        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        }
        if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        }
        return `${seconds}s`;
    }
}
