import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, ClientSession } from 'mongoose';
import { DatabaseError } from '@common/errors';
import { ErrorCodes } from '@common/errors';

/**
 * Transaction options
 */
export interface TransactionOptions {
    /**
     * Maximum number of retry attempts for transient errors
     */
    maxRetries?: number;
    /**
     * Timeout in milliseconds for the transaction
     */
    timeoutMs?: number;
}

/**
 * Transaction Manager
 * Provides atomic transaction support for MongoDB operations
 */
@Injectable()
export class TransactionManager {
    private readonly logger = new Logger(TransactionManager.name);
    private readonly defaultMaxRetries = 3;
    private readonly defaultTimeoutMs = 30000;

    constructor(@InjectConnection() private connection: Connection) { }

    /**
     * Execute a function within a MongoDB transaction
     * Automatically handles session creation, commit, abort, and cleanup
     * 
     * @param fn - Function to execute within the transaction (receives session)
     * @param options - Transaction configuration options
     * @returns Result of the function
     * @throws DatabaseError on transaction failure
     */
    async withTransaction<T>(
        fn: (session: ClientSession) => Promise<T>,
        options: TransactionOptions = {},
    ): Promise<T> {
        const maxRetries = options.maxRetries ?? this.defaultMaxRetries;
        const timeoutMs = options.timeoutMs ?? this.defaultTimeoutMs;

        let attempts = 0;
        let lastError: Error | null = null;

        while (attempts < maxRetries) {
            attempts++;
            const session = await this.connection.startSession();

            try {
                session.startTransaction({
                    readConcern: { level: 'snapshot' },
                    writeConcern: { w: 'majority' },
                    maxTimeMS: timeoutMs,
                });

                const result = await fn(session);

                await session.commitTransaction();
                this.logger.debug(`Transaction committed successfully (attempt ${attempts})`);

                return result;
            } catch (error) {
                await this.handleTransactionError(session, error, attempts, maxRetries);
                lastError = error as Error;

                // Check if error is retryable
                if (!this.isRetryableError(error)) {
                    throw this.wrapError(error);
                }

                this.logger.warn(
                    `Transaction failed (attempt ${attempts}/${maxRetries}), retrying...`,
                );
            } finally {
                await session.endSession();
            }
        }

        // All retries exhausted
        this.logger.error(`Transaction failed after ${maxRetries} attempts`);
        throw new DatabaseError(
            'Transaction failed after maximum retries',
            ErrorCodes.DB_TRANSACTION_FAILED,
            { originalError: lastError?.message },
        );
    }

    /**
     * Execute multiple operations atomically
     * Creates a session and passes it to all operations
     */
    async runAtomic<T>(
        operations: Array<(session: ClientSession) => Promise<any>>,
        options: TransactionOptions = {},
    ): Promise<T[]> {
        return this.withTransaction(async (session) => {
            const results: T[] = [];

            for (const operation of operations) {
                const result = await operation(session);
                results.push(result);
            }

            return results;
        }, options);
    }

    /**
     * Handle transaction error - abort and log appropriately
     */
    private async handleTransactionError(
        session: ClientSession,
        error: unknown,
        attempt: number,
        maxAttempts: number,
    ): Promise<void> {
        try {
            await session.abortTransaction();
            this.logger.warn(`Transaction aborted (attempt ${attempt}/${maxAttempts})`);
        } catch (abortError) {
            this.logger.error('Failed to abort transaction', abortError);
        }
    }

    /**
     * Check if an error is retryable
     * MongoDB transient errors can be safely retried
     */
    private isRetryableError(error: unknown): boolean {
        if (!(error instanceof Error)) return false;

        const retryableErrorNames = [
            'TransientTransactionError',
            'UnknownTransactionCommitResult',
        ];

        const mongoError = error as any;

        // Check error labels (MongoDB driver pattern)
        if (mongoError.errorLabels?.some((label: string) =>
            retryableErrorNames.includes(label)
        )) {
            return true;
        }

        // Check for specific error codes
        const retryableCodes = [112, 251]; // WriteConflict, TransactionTooLarge
        if (retryableCodes.includes(mongoError.code)) {
            return true;
        }

        return false;
    }

    /**
     * Wrap error in domain error for consistent handling
     */
    private wrapError(error: unknown): DatabaseError {
        const message = error instanceof Error ? error.message : 'Unknown transaction error';

        return new DatabaseError(
            'Transaction failed',
            ErrorCodes.DB_TRANSACTION_FAILED,
            { originalError: message },
        );
    }

    /**
     * Create a session without starting a transaction
     * Useful for read-heavy operations that need consistency
     */
    async createSession(): Promise<ClientSession> {
        return this.connection.startSession();
    }

    /**
     * Check if transactions are supported
     * Replica sets or sharded clusters required
     */
    async supportsTransactions(): Promise<boolean> {
        try {
            const session = await this.connection.startSession();
            await session.endSession();
            return true;
        } catch {
            return false;
        }
    }
}
