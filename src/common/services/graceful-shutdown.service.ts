import { Injectable, OnApplicationShutdown, Logger, BeforeApplicationShutdown } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

/**
 * Graceful Shutdown Service
 * Handles proper cleanup on application termination
 */
@Injectable()
export class GracefulShutdownService implements BeforeApplicationShutdown, OnApplicationShutdown {
    private readonly logger = new Logger(GracefulShutdownService.name);
    private isShuttingDown = false;
    private activeRequests = 0;
    private shutdownTimeout = 30000; // 30 seconds

    constructor(
        @InjectConnection() private readonly connection: Connection,
    ) {
        // Handle process signals
        process.on('SIGTERM', () => this.initiateShutdown('SIGTERM'));
        process.on('SIGINT', () => this.initiateShutdown('SIGINT'));
    }

    /**
     * Track active request start
     */
    incrementActiveRequests(): void {
        if (!this.isShuttingDown) {
            this.activeRequests++;
        }
    }

    /**
     * Track active request completion
     */
    decrementActiveRequests(): void {
        this.activeRequests--;
    }

    /**
     * Check if shutdown is in progress
     */
    isInShutdownMode(): boolean {
        return this.isShuttingDown;
    }

    /**
     * Get current active request count
     */
    getActiveRequestCount(): number {
        return this.activeRequests;
    }

    /**
     * Called before application shutdown starts
     */
    async beforeApplicationShutdown(signal?: string): Promise<void> {
        this.logger.warn(`Received shutdown signal: ${signal}. Starting graceful shutdown...`);
        this.isShuttingDown = true;

        // Wait for active requests to complete
        await this.waitForActiveRequests();
    }

    /**
     * Called when application is shutting down
     */
    async onApplicationShutdown(signal?: string): Promise<void> {
        this.logger.log('Closing database connections...');

        try {
            // Close MongoDB connection
            if (this.connection.readyState === 1) {
                await this.connection.close();
                this.logger.log('MongoDB connection closed');
            }
        } catch (error) {
            this.logger.error('Error closing MongoDB connection', error);
        }

        this.logger.log('Graceful shutdown complete');
    }

    private initiateShutdown(signal: string): void {
        this.logger.warn(`Process received ${signal}`);
    }

    private async waitForActiveRequests(): Promise<void> {
        const startTime = Date.now();

        while (this.activeRequests > 0) {
            const elapsed = Date.now() - startTime;

            if (elapsed > this.shutdownTimeout) {
                this.logger.warn(
                    `Shutdown timeout reached with ${this.activeRequests} active requests still pending`
                );
                break;
            }

            this.logger.log(`Waiting for ${this.activeRequests} active requests to complete...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}
