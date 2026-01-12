import { Email } from '../../../src/domain/value-objects/email.vo';

describe('Email Value Object', () => {
    describe('create', () => {
        it('should create a valid email', () => {
            const email = Email.create('test@example.com');
            expect(email.value).toBe('test@example.com');
        });

        it('should normalize email to lowercase', () => {
            const email = Email.create('Test@EXAMPLE.Com');
            expect(email.value).toBe('test@example.com');
        });

        it('should trim whitespace', () => {
            const email = Email.create('  test@example.com  ');
            expect(email.value).toBe('test@example.com');
        });

        it('should throw error for invalid email format', () => {
            expect(() => Email.create('invalid-email')).toThrow();
        });

        it('should throw error for empty email', () => {
            expect(() => Email.create('')).toThrow();
        });

        it('should throw error for email without @', () => {
            expect(() => Email.create('testexample.com')).toThrow('Invalid email format');
        });
    });

    describe('validate', () => {
        it('should return valid for correct email', () => {
            const result = Email.validate('test@example.com');
            expect(result.isValid).toBe(true);
            expect(result.error).toBeUndefined();
        });

        it('should return invalid for null email', () => {
            const result = Email.validate(null as any);
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Email is required');
        });

        it('should return invalid for email exceeding max length', () => {
            const longEmail = 'a'.repeat(250) + '@example.com';
            const result = Email.validate(longEmail);
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Email cannot exceed 255 characters');
        });
    });

    describe('domain', () => {
        it('should extract domain from email', () => {
            const email = Email.create('user@company.com');
            expect(email.domain).toBe('company.com');
        });
    });

    describe('localPart', () => {
        it('should extract local part from email', () => {
            const email = Email.create('john.doe@example.com');
            expect(email.localPart).toBe('john.doe');
        });
    });

    describe('equals', () => {
        it('should return true for equal emails', () => {
            const email1 = Email.create('test@example.com');
            const email2 = Email.create('test@example.com');
            expect(email1.equals(email2)).toBe(true);
        });

        it('should return false for different emails', () => {
            const email1 = Email.create('test1@example.com');
            const email2 = Email.create('test2@example.com');
            expect(email1.equals(email2)).toBe(false);
        });

        it('should handle case normalization in equality', () => {
            const email1 = Email.create('TEST@example.com');
            const email2 = Email.create('test@EXAMPLE.COM');
            expect(email1.equals(email2)).toBe(true);
        });
    });
});
