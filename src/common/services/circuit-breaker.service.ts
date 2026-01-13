import { Injectable, Logger } from '@nestjs/common';

export enum CircuitState {
    CLOSED = 'CLOSED',     // Normal operation
    OPEN = 'OPEN',         // Failing, reject requests
    HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

export interface CircuitBreakerOptions {
    failureThreshold?: number;      // Number of failures before opening
    successThreshold?: number;      // Successes needed to close from half-open
    timeout?: number;               // Time in ms before trying half-open
}

interface CircuitStats {
    state: CircuitState;
    failures: number;
    successes: number;
    lastFailure: Date | null;
    lastSuccess: Date | null;
    openedAt: Date | null;
}

/**
 * Circuit Breaker Service
 * Prevents cascading failures for external dependencies
 */
@Injectable()
export class CircuitBreakerService {
    private readonly logger = new Logger(CircuitBreakerService.name);
    private circuits: Map<string, CircuitStats> = new Map();
    private options: Required<CircuitBreakerOptions>;

    constructor() {
        this.options = {
            failureThreshold: 5,
            successThreshold: 3,
            timeout: 30000, // 30 seconds
        };
    }

    /**
     * Execute a function with circuit breaker protection
     */
    async execute<T>(
        circuitName: string,
        fn: () => Promise<T>,
        fallback?: () => T,
    ): Promise<T> {
        const circuit = this.getOrCreateCircuit(circuitName);

        // Check if circuit is open
        if (circuit.state === CircuitState.OPEN) {
            if (this.shouldAttemptReset(circuit)) {
                circuit.state = CircuitState.HALF_OPEN;
                this.logger.log(`Circuit ${circuitName} entering HALF_OPEN state`);
            } else {
                this.logger.warn(`Circuit ${circuitName} is OPEN, rejecting request`);
                if (fallback) {
                    return fallback();
                }
                throw new Error(`Service ${circuitName} is unavailable`);
            }
        }

        try {
            const result = await fn();
            this.recordSuccess(circuitName, circuit);
            return result;
        } catch (error) {
            this.recordFailure(circuitName, circuit);
            if (fallback) {
                return fallback();
            }
            throw error;
        }
    }

    /**
     * Get circuit state
     */
    getState(circuitName: string): CircuitState {
        return this.getOrCreateCircuit(circuitName).state;
    }

    /**
     * Get all circuit stats
     */
    getAllStats(): Record<string, CircuitStats> {
        const stats: Record<string, CircuitStats> = {};
        this.circuits.forEach((circuit, name) => {
            stats[name] = { ...circuit };
        });
        return stats;
    }

    /**
     * Reset a circuit
     */
    reset(circuitName: string): void {
        const circuit = this.circuits.get(circuitName);
        if (circuit) {
            circuit.state = CircuitState.CLOSED;
            circuit.failures = 0;
            circuit.successes = 0;
            this.logger.log(`Circuit ${circuitName} manually reset`);
        }
    }

    private getOrCreateCircuit(name: string): CircuitStats {
        if (!this.circuits.has(name)) {
            this.circuits.set(name, {
                state: CircuitState.CLOSED,
                failures: 0,
                successes: 0,
                lastFailure: null,
                lastSuccess: null,
                openedAt: null,
            });
        }
        return this.circuits.get(name)!;
    }

    private recordSuccess(name: string, circuit: CircuitStats): void {
        circuit.successes++;
        circuit.lastSuccess = new Date();
        circuit.failures = 0;

        if (circuit.state === CircuitState.HALF_OPEN) {
            if (circuit.successes >= this.options.successThreshold) {
                circuit.state = CircuitState.CLOSED;
                circuit.openedAt = null;
                this.logger.log(`Circuit ${name} closed after recovery`);
            }
        }
    }

    private recordFailure(name: string, circuit: CircuitStats): void {
        circuit.failures++;
        circuit.lastFailure = new Date();
        circuit.successes = 0;

        if (circuit.failures >= this.options.failureThreshold) {
            if (circuit.state !== CircuitState.OPEN) {
                circuit.state = CircuitState.OPEN;
                circuit.openedAt = new Date();
                this.logger.warn(`Circuit ${name} opened after ${circuit.failures} failures`);
            }
        }
    }

    private shouldAttemptReset(circuit: CircuitStats): boolean {
        if (!circuit.openedAt) return false;
        const elapsed = Date.now() - circuit.openedAt.getTime();
        return elapsed >= this.options.timeout;
    }
}
