import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';
import { v4 as uuidv4 } from 'uuid';

/**
 * Distributed Lock Service
 * Provides Redis-based distributed locking for concurrency control
 */
@Injectable()
export class DistributedLockService {
    private readonly logger = new Logger(DistributedLockService.name);
    private readonly DEFAULT_TTL = 10; // 10 seconds
    private readonly LOCK_PREFIX = 'lock:';

    constructor(private readonly redisService: RedisService) { }

    /**
     * Acquire a distributed lock
     * @param key Lock key
     * @param ttlSeconds Time-to-live in seconds
     * @returns Lock ID if successful, null otherwise
     */
    async acquireLock(key: string, ttlSeconds: number = this.DEFAULT_TTL): Promise<string | null> {
        if (!this.redisService.isAvailable()) {
            this.logger.warn('Redis unavailable, lock acquisition skipped');
            return null;
        }

        const lockKey = `${this.LOCK_PREFIX}${key}`;
        const lockId = uuidv4();

        try {
            const acquired = await this.redisService.set(lockKey, lockId, ttlSeconds);

            if (acquired) {
                this.logger.debug(`Lock acquired: ${lockKey} [${lockId}]`);
                return lockId;
            }

            this.logger.debug(`Lock acquisition failed: ${lockKey}`);
            return null;
        } catch (error: any) {
            this.logger.error(`Error acquiring lock ${lockKey}: ${error.message}`);
            return null;
        }
    }

    /**
     * Release a distributed lock
     * @param key Lock key
     * @param lockId Lock ID from acquisition
     * @returns true if released, false otherwise
     */
    async releaseLock(key: string, lockId: string): Promise<boolean> {
        if (!this.redisService.isAvailable()) {
            return false;
        }

        const lockKey = `${this.LOCK_PREFIX}${key}`;

        try {
            // Only release if the lock ID matches (prevent releasing someone else's lock)
            const currentLockId = await this.redisService.get<string>(lockKey);

            if (currentLockId === lockId) {
                await this.redisService.del(lockKey);
                this.logger.debug(`Lock released: ${lockKey} [${lockId}]`);
                return true;
            }

            this.logger.warn(`Lock release failed - ID mismatch: ${lockKey}`);
            return false;
        } catch (error: any) {
            this.logger.error(`Error releasing lock ${lockKey}: ${error.message}`);
            return false;
        }
    }

    /**
     * Execute a function with automatic lock acquisition and release
     * @param key Lock key
     * @param fn Function to execute while holding the lock
     * @param ttlSeconds Lock TTL
     * @returns Result of the function
     * @throws Error if lock cannot be acquired
     */
    async executeWithLock<T>(
        key: string,
        fn: () => Promise<T>,
        ttlSeconds: number = this.DEFAULT_TTL,
    ): Promise<T> {
        const lockId = await this.acquireLock(key, ttlSeconds);

        if (!lockId) {
            throw new Error(`Unable to acquire lock for key: ${key}`);
        }

        try {
            const result = await fn();
            return result;
        } finally {
            await this.releaseLock(key, lockId);
        }
    }

    /**
     * Check if a lock exists
     * @param key Lock key
     * @returns true if locked, false otherwise
     */
    async isLocked(key: string): Promise<boolean> {
        if (!this.redisService.isAvailable()) {
            return false;
        }

        const lockKey = `${this.LOCK_PREFIX}${key}`;
        return await this.redisService.exists(lockKey);
    }
}
