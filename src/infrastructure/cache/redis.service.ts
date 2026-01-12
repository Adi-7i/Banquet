import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Redis Service
 * Handles Redis connections and caching operations
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(RedisService.name);
    private client: Redis | null = null;
    private isConnected = false;

    constructor(private configService: ConfigService) { }

    async onModuleInit() {
        try {
            const redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';

            this.client = new Redis(redisUrl, {
                retryStrategy: (times: number) => {
                    if (times > 3) {
                        this.logger.warn('Redis connection failed after 3 retries. Running without cache.');
                        return null;
                    }
                    return Math.min(times * 1000, 3000);
                },
                maxRetriesPerRequest: 3,
            });

            this.client.on('connect', () => {
                this.isConnected = true;
                this.logger.log('✅ Redis connected successfully');
            });

            this.client.on('error', (err: Error) => {
                this.isConnected = false;
                this.logger.warn(`Redis connection error: ${err.message}. Continuing without cache.`);
            });

            this.client.on('close', () => {
                this.isConnected = false;
                this.logger.warn('Redis connection closed. Cache disabled.');
            });
        } catch (error: any) {
            this.logger.warn(`Failed to initialize Redis: ${error.message}. Running without cache.`);
            this.client = null;
        }
    }

    async onModuleDestroy() {
        if (this.client) {
            await this.client.quit();
            this.logger.log('Redis connection closed');
        }
    }

    /**
     * Get value from Redis
     */
    async get<T>(key: string): Promise<T | null> {
        if (!this.isConnected || !this.client) {
            return null;
        }

        try {
            const value = await this.client.get(key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            this.logger.warn(`Redis GET error for key ${key}: ${error.message}`);
            return null;
        }
    }

    /**
     * Set value in Redis with optional TTL
     */
    async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
        if (!this.isConnected || !this.client) {
            return false;
        }

        try {
            const serialized = JSON.stringify(value);
            if (ttlSeconds) {
                await this.client.setex(key, ttlSeconds, serialized);
            } else {
                await this.client.set(key, serialized);
            }
            return true;
        } catch (error) {
            this.logger.warn(`Redis SET error for key ${key}: ${error.message}`);
            return false;
        }
    }

    /**
     * Delete key from Redis
     */
    async del(key: string): Promise<boolean> {
        if (!this.isConnected || !this.client) {
            return false;
        }

        try {
            await this.client.del(key);
            return true;
        } catch (error) {
            this.logger.warn(`Redis DEL error for key ${key}: ${error.message}`);
            return false;
        }
    }

    /**
     * Delete keys matching pattern
     */
    async delPattern(pattern: string): Promise<number> {
        if (!this.isConnected || !this.client) {
            return 0;
        }

        try {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(...keys);
                return keys.length;
            }
            return 0;
        } catch (error) {
            this.logger.warn(`Redis DEL pattern error for ${pattern}: ${error.message}`);
            return 0;
        }
    }

    /**
     * Check if key exists
     */
    async exists(key: string): Promise<boolean> {
        if (!this.isConnected || !this.client) {
            return false;
        }

        try {
            const result = await this.client.exists(key);
            return result === 1;
        } catch (error) {
            this.logger.warn(`Redis EXISTS error for key ${key}: ${error.message}`);
            return false;
        }
    }

    /**
     * Get TTL for key
     */
    async ttl(key: string): Promise<number> {
        if (!this.isConnected || !this.client) {
            return -2;
        }

        try {
            return await this.client.ttl(key);
        } catch (error) {
            this.logger.warn(`Redis TTL error for key ${key}: ${error.message}`);
            return -2;
        }
    }

    /**
     * Check if Redis is available
     */
    isAvailable(): boolean {
        return this.isConnected && this.client !== null;
    }
}
