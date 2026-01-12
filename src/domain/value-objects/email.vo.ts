/**
 * Email Value Object
 * Immutable representation of a validated email address
 */
export class Email {
    private readonly _value: string;

    private constructor(value: string) {
        this._value = value.toLowerCase().trim();
    }

    /**
     * Create an Email value object from a string
     * @throws Error if email is invalid
     */
    static create(email: string): Email {
        const validation = Email.validate(email);
        if (!validation.isValid) {
            throw new Error(validation.error);
        }
        return new Email(email);
    }

    /**
     * Create an Email without validation (for trusted sources like DB)
     */
    static fromTrusted(email: string): Email {
        return new Email(email);
    }

    /**
     * Validate email format
     */
    static validate(email: string): { isValid: boolean; error?: string } {
        if (!email || typeof email !== 'string') {
            return { isValid: false, error: 'Email is required' };
        }

        const trimmed = email.trim();

        if (trimmed.length === 0) {
            return { isValid: false, error: 'Email cannot be empty' };
        }

        if (trimmed.length > 255) {
            return { isValid: false, error: 'Email cannot exceed 255 characters' };
        }

        // RFC 5322 compatible email regex
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

        if (!emailRegex.test(trimmed)) {
            return { isValid: false, error: 'Invalid email format' };
        }

        return { isValid: true };
    }

    /**
     * Get the email value
     */
    get value(): string {
        return this._value;
    }

    /**
     * Get the domain part of the email
     */
    get domain(): string {
        return this._value.split('@')[1];
    }

    /**
     * Get the local part (before @) of the email
     */
    get localPart(): string {
        return this._value.split('@')[0];
    }

    /**
     * Compare with another email
     */
    equals(other: Email): boolean {
        return this._value === other._value;
    }

    /**
     * String representation
     */
    toString(): string {
        return this._value;
    }
}
