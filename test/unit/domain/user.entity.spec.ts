import { User, UserRole, UserStatus } from '../../../src/domain/entities/user.entity';
import { Email } from '../../../src/domain/value-objects/email.vo';
import { Password } from '../../../src/domain/value-objects/password.vo';

describe('User Entity', () => {
    const createTestUser = (overrides: Partial<{
        id: string;
        role: UserRole;
        status: UserStatus;
    }> = {}) => {
        return User.create({
            id: overrides.id || 'user-123',
            email: Email.create('test@example.com'),
            password: Password.fromHashed('$2b$10$hashedPassword'),
            role: overrides.role || UserRole.CUSTOMER,
            status: overrides.status || UserStatus.ACTIVE,
            emailVerified: true,
        });
    };

    describe('isActive', () => {
        it('should return true for active user', () => {
            const user = createTestUser({ status: UserStatus.ACTIVE });
            expect(user.isActive()).toBe(true);
        });

        it('should return false for inactive user', () => {
            const user = createTestUser({ status: UserStatus.INACTIVE });
            expect(user.isActive()).toBe(false);
        });

        it('should return false for suspended user', () => {
            const user = createTestUser({ status: UserStatus.SUSPENDED });
            expect(user.isActive()).toBe(false);
        });
    });

    describe('isAdmin', () => {
        it('should return true for admin role', () => {
            const user = createTestUser({ role: UserRole.ADMIN });
            expect(user.isAdmin()).toBe(true);
        });

        it('should return false for non-admin roles', () => {
            const customer = createTestUser({ role: UserRole.CUSTOMER });
            const owner = createTestUser({ role: UserRole.OWNER });
            expect(customer.isAdmin()).toBe(false);
            expect(owner.isAdmin()).toBe(false);
        });
    });

    describe('canPerformAdminActions', () => {
        it('should return true for active admin', () => {
            const user = createTestUser({ role: UserRole.ADMIN, status: UserStatus.ACTIVE });
            expect(user.canPerformAdminActions()).toBe(true);
        });

        it('should return false for inactive admin', () => {
            const user = createTestUser({ role: UserRole.ADMIN, status: UserStatus.INACTIVE });
            expect(user.canPerformAdminActions()).toBe(false);
        });

        it('should return false for active non-admin', () => {
            const user = createTestUser({ role: UserRole.CUSTOMER, status: UserStatus.ACTIVE });
            expect(user.canPerformAdminActions()).toBe(false);
        });
    });

    describe('canManageBanquets', () => {
        it('should return true for active owner', () => {
            const user = createTestUser({ role: UserRole.OWNER, status: UserStatus.ACTIVE });
            expect(user.canManageBanquets()).toBe(true);
        });

        it('should return true for active admin', () => {
            const user = createTestUser({ role: UserRole.ADMIN, status: UserStatus.ACTIVE });
            expect(user.canManageBanquets()).toBe(true);
        });

        it('should return false for customer', () => {
            const user = createTestUser({ role: UserRole.CUSTOMER, status: UserStatus.ACTIVE });
            expect(user.canManageBanquets()).toBe(false);
        });

        it('should return false for inactive owner', () => {
            const user = createTestUser({ role: UserRole.OWNER, status: UserStatus.INACTIVE });
            expect(user.canManageBanquets()).toBe(false);
        });
    });

    describe('canMakeBookings', () => {
        it('should return true for active customer', () => {
            const user = createTestUser({ role: UserRole.CUSTOMER, status: UserStatus.ACTIVE });
            expect(user.canMakeBookings()).toBe(true);
        });

        it('should return true for active admin', () => {
            const user = createTestUser({ role: UserRole.ADMIN, status: UserStatus.ACTIVE });
            expect(user.canMakeBookings()).toBe(true);
        });

        it('should return false for owner', () => {
            const user = createTestUser({ role: UserRole.OWNER, status: UserStatus.ACTIVE });
            expect(user.canMakeBookings()).toBe(false);
        });
    });

    describe('canUpdateUser', () => {
        it('should allow user to update themselves', () => {
            const user = createTestUser({ id: 'user-123' });
            expect(user.canUpdateUser('user-123')).toBe(true);
        });

        it('should allow admin to update anyone', () => {
            const admin = createTestUser({ id: 'admin-1', role: UserRole.ADMIN });
            expect(admin.canUpdateUser('other-user-456')).toBe(true);
        });

        it('should prevent user from updating others', () => {
            const user = createTestUser({ id: 'user-123', role: UserRole.CUSTOMER });
            expect(user.canUpdateUser('other-user-456')).toBe(false);
        });

        it('should prevent inactive user from updating', () => {
            const user = createTestUser({ id: 'user-123', status: UserStatus.INACTIVE });
            expect(user.canUpdateUser('user-123')).toBe(false);
        });
    });

    describe('canDeactivateUser', () => {
        it('should allow admin to deactivate other users', () => {
            const admin = createTestUser({ id: 'admin-1', role: UserRole.ADMIN });
            expect(admin.canDeactivateUser('user-123')).toBe(true);
        });

        it('should prevent admin from deactivating themselves', () => {
            const admin = createTestUser({ id: 'admin-1', role: UserRole.ADMIN });
            expect(admin.canDeactivateUser('admin-1')).toBe(false);
        });

        it('should prevent non-admin from deactivating users', () => {
            const user = createTestUser({ role: UserRole.CUSTOMER });
            expect(user.canDeactivateUser('other-user')).toBe(false);
        });
    });

    describe('factory methods', () => {
        it('should create customer with correct defaults', () => {
            const customer = User.createCustomer(
                Email.create('customer@example.com'),
                Password.fromHashed('hash'),
                'new-id',
            );
            expect(customer.role).toBe(UserRole.CUSTOMER);
            expect(customer.status).toBe(UserStatus.ACTIVE);
            expect(customer.emailVerified).toBe(false);
        });

        it('should create owner with correct defaults', () => {
            const owner = User.createOwner(
                Email.create('owner@example.com'),
                Password.fromHashed('hash'),
                'new-id',
            );
            expect(owner.role).toBe(UserRole.OWNER);
            expect(owner.status).toBe(UserStatus.ACTIVE);
        });
    });

    describe('fromPersistence', () => {
        it('should reconstitute user from database data', () => {
            const user = User.fromPersistence({
                id: 'db-id-123',
                email: 'db@example.com',
                password: '$2b$10$hash',
                role: UserRole.OWNER,
                status: UserStatus.ACTIVE,
                emailVerified: true,
                lastLoginAt: new Date('2024-01-01'),
            });

            expect(user.id).toBe('db-id-123');
            expect(user.email.value).toBe('db@example.com');
            expect(user.role).toBe(UserRole.OWNER);
            expect(user.lastLoginAt).toEqual(new Date('2024-01-01'));
        });
    });
});
