import { Password } from '../../../src/domain/value-objects/password.vo';

describe('Password Value Object', () => {
    describe('validateStrength', () => {
        it('should return valid for strong password', () => {
            const result = Password.validateStrength('SecurePass123!');
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
            expect(result.score).toBeGreaterThanOrEqual(4);
        });

        it('should return invalid for short password', () => {
            const result = Password.validateStrength('Short1!');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain(`Password must be at least ${Password.MIN_LENGTH} characters`);
        });

        it('should require lowercase letter', () => {
            const result = Password.validateStrength('ALLUPPERCASE123!');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one lowercase letter');
        });

        it('should require uppercase letter', () => {
            const result = Password.validateStrength('alllowercase123!');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one uppercase letter');
        });

        it('should require number', () => {
            const result = Password.validateStrength('NoNumbersHere!');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one number');
        });

        it('should require special character', () => {
            const result = Password.validateStrength('NoSpecialChar123');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one special character');
        });

        it('should return invalid for empty password', () => {
            const result = Password.validateStrength('');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password is required');
        });

        it('should return multiple errors for very weak password', () => {
            const result = Password.validateStrength('weak');
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(1);
        });
    });

    describe('isCommonPassword', () => {
        it('should detect common passwords', () => {
            expect(Password.isCommonPassword('password')).toBe(true);
            expect(Password.isCommonPassword('123456')).toBe(true);
            expect(Password.isCommonPassword('qwerty')).toBe(true);
        });

        it('should not flag unique passwords', () => {
            expect(Password.isCommonPassword('MyUniquePass2024!')).toBe(false);
        });

        it('should be case insensitive', () => {
            expect(Password.isCommonPassword('PASSWORD')).toBe(true);
            expect(Password.isCommonPassword('QWERTY')).toBe(true);
        });
    });

    describe('fromHashed', () => {
        it('should create password from hashed value', () => {
            const hashedValue = '$2b$10$someHashedValue';
            const password = Password.fromHashed(hashedValue);
            expect(password.hashedValue).toBe(hashedValue);
        });
    });

    describe('getStrengthLabel', () => {
        it('should return weak for low scores', () => {
            expect(Password.getStrengthLabel(1)).toBe('weak');
            expect(Password.getStrengthLabel(2)).toBe('weak');
        });

        it('should return fair for medium scores', () => {
            expect(Password.getStrengthLabel(3)).toBe('fair');
        });

        it('should return good for higher scores', () => {
            expect(Password.getStrengthLabel(4)).toBe('good');
        });

        it('should return strong for highest scores', () => {
            expect(Password.getStrengthLabel(5)).toBe('strong');
        });
    });

    describe('equals', () => {
        it('should return true for matching hashes', () => {
            const hash = '$2b$10$someHash';
            const password1 = Password.fromHashed(hash);
            const password2 = Password.fromHashed(hash);
            expect(password1.equals(password2)).toBe(true);
        });

        it('should return false for different hashes', () => {
            const password1 = Password.fromHashed('$2b$10$hash1');
            const password2 = Password.fromHashed('$2b$10$hash2');
            expect(password1.equals(password2)).toBe(false);
        });
    });
});
