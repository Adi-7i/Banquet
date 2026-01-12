/**
 * Password Value Object
 * Immutable representation with password strength validation
 */
export class Password {
    private readonly _hashedValue: string;

    /**
     * Minimum password length requirement
     */
    static readonly MIN_LENGTH = 8;

    /**
     * Maximum password length requirement
     */
    static readonly MAX_LENGTH = 128;

    private constructor(hashedValue: string) {
        this._hashedValue = hashedValue;
    }

    /**
     * Create Password from already-hashed value (from DB)
     */
    static fromHashed(hashedValue: string): Password {
        return new Password(hashedValue);
    }

    /**
     * Validate password strength (for plain text passwords)
     * Returns validation result with specific errors
     */
    static validateStrength(plainPassword: string): {
        isValid: boolean;
        score: number;
        errors: string[];
    } {
        const errors: string[] = [];
        let score = 0;

        if (!plainPassword || typeof plainPassword !== 'string') {
            return { isValid: false, score: 0, errors: ['Password is required'] };
        }

        // Length check
        if (plainPassword.length < Password.MIN_LENGTH) {
            errors.push(`Password must be at least ${Password.MIN_LENGTH} characters`);
        } else {
            score += 1;
        }

        if (plainPassword.length > Password.MAX_LENGTH) {
            errors.push(`Password cannot exceed ${Password.MAX_LENGTH} characters`);
        }

        // Lowercase check
        if (!/[a-z]/.test(plainPassword)) {
            errors.push('Password must contain at least one lowercase letter');
        } else {
            score += 1;
        }

        // Uppercase check
        if (!/[A-Z]/.test(plainPassword)) {
            errors.push('Password must contain at least one uppercase letter');
        } else {
            score += 1;
        }

        // Number check
        if (!/\d/.test(plainPassword)) {
            errors.push('Password must contain at least one number');
        } else {
            score += 1;
        }

        // Special character check
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(plainPassword)) {
            errors.push('Password must contain at least one special character');
        } else {
            score += 1;
        }

        return {
            isValid: errors.length === 0,
            score,
            errors,
        };
    }

    /**
     * Check if password is common/weak
     */
    static isCommonPassword(password: string): boolean {
        const commonPasswords = [
            'password', 'password123', '123456', '12345678', 'qwerty',
            'abc123', 'monkey', '1234567', 'letmein', 'trustno1',
            'dragon', 'baseball', 'iloveyou', 'master', 'sunshine',
            'ashley', 'foobar', 'shadow', '123123', '654321',
        ];
        return commonPasswords.includes(password.toLowerCase());
    }

    /**
     * Get the hashed value
     */
    get hashedValue(): string {
        return this._hashedValue;
    }

    /**
     * Compare with another password hash
     */
    equals(other: Password): boolean {
        return this._hashedValue === other._hashedValue;
    }

    /**
     * Get password strength label
     */
    static getStrengthLabel(score: number): 'weak' | 'fair' | 'good' | 'strong' {
        if (score <= 2) return 'weak';
        if (score <= 3) return 'fair';
        if (score <= 4) return 'good';
        return 'strong';
    }
}
