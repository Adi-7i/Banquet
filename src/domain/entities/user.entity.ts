import { Email } from '../value-objects/email.vo';
import { Password } from '../value-objects/password.vo';

/**
 * User roles in the system
 */
export enum UserRole {
    ADMIN = 'ADMIN',
    OWNER = 'OWNER',
    CUSTOMER = 'CUSTOMER',
}

/**
 * User status
 */
export enum UserStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    SUSPENDED = 'SUSPENDED',
    PENDING = 'PENDING',
}

/**
 * User domain entity props
 */
export interface UserProps {
    id: string;
    email: Email;
    password: Password;
    role: UserRole;
    status: UserStatus;
    emailVerified?: boolean;
    lastLoginAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * User Domain Entity
 * Contains core business rules for user management
 */
export class User {
    private readonly props: UserProps;

    private constructor(props: UserProps) {
        this.props = props;
    }

    /**
     * Create a new User entity
     */
    static create(props: UserProps): User {
        return new User(props);
    }

    /**
     * Reconstitute User from persistence
     */
    static fromPersistence(data: {
        id: string;
        email: string;
        password: string;
        role: UserRole;
        status: UserStatus;
        emailVerified?: boolean;
        lastLoginAt?: Date;
        createdAt?: Date;
        updatedAt?: Date;
    }): User {
        return new User({
            id: data.id,
            email: Email.fromTrusted(data.email),
            password: Password.fromHashed(data.password),
            role: data.role,
            status: data.status,
            emailVerified: data.emailVerified,
            lastLoginAt: data.lastLoginAt,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
        });
    }

    // ============ Getters ============

    get id(): string {
        return this.props.id;
    }

    get email(): Email {
        return this.props.email;
    }

    get password(): Password {
        return this.props.password;
    }

    get role(): UserRole {
        return this.props.role;
    }

    get status(): UserStatus {
        return this.props.status;
    }

    get emailVerified(): boolean {
        return this.props.emailVerified || false;
    }

    get lastLoginAt(): Date | undefined {
        return this.props.lastLoginAt;
    }

    get createdAt(): Date | undefined {
        return this.props.createdAt;
    }

    get updatedAt(): Date | undefined {
        return this.props.updatedAt;
    }

    // ============ Business Rules ============

    /**
     * Check if user is active
     */
    isActive(): boolean {
        return this.props.status === UserStatus.ACTIVE;
    }

    /**
     * Check if user is an admin
     */
    isAdmin(): boolean {
        return this.props.role === UserRole.ADMIN;
    }

    /**
     * Check if user is an owner
     */
    isOwner(): boolean {
        return this.props.role === UserRole.OWNER;
    }

    /**
     * Check if user is a customer
     */
    isCustomer(): boolean {
        return this.props.role === UserRole.CUSTOMER;
    }

    /**
     * Check if user can perform admin actions
     */
    canPerformAdminActions(): boolean {
        return this.isAdmin() && this.isActive();
    }

    /**
     * Check if user can manage banquets (owners only)
     */
    canManageBanquets(): boolean {
        return (this.isOwner() || this.isAdmin()) && this.isActive();
    }

    /**
     * Check if user can make bookings (customers only)
     */
    canMakeBookings(): boolean {
        return (this.isCustomer() || this.isAdmin()) && this.isActive();
    }

    /**
     * Check if user can update another user
     * Business rule: Users can only update themselves, admins can update anyone
     */
    canUpdateUser(targetUserId: string): boolean {
        if (!this.isActive()) return false;
        if (this.isAdmin()) return true;
        return this.props.id === targetUserId;
    }

    /**
     * Check if user can deactivate another user
     * Business rule: Only admins can deactivate users, no one can deactivate themselves
     */
    canDeactivateUser(targetUserId: string): boolean {
        if (!this.isActive()) return false;
        if (this.props.id === targetUserId) return false;
        return this.isAdmin();
    }

    /**
     * Check if user can view another user's profile
     */
    canViewUserProfile(targetUserId: string): boolean {
        if (!this.isActive()) return false;
        if (this.isAdmin()) return true;
        return this.props.id === targetUserId;
    }

    // ============ Factory Methods ============

    /**
     * Create a new customer user
     */
    static createCustomer(email: Email, password: Password, id: string): User {
        return new User({
            id,
            email,
            password,
            role: UserRole.CUSTOMER,
            status: UserStatus.ACTIVE,
            emailVerified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }

    /**
     * Create a new owner user
     */
    static createOwner(email: Email, password: Password, id: string): User {
        return new User({
            id,
            email,
            password,
            role: UserRole.OWNER,
            status: UserStatus.ACTIVE,
            emailVerified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    }

    /**
     * Convert to plain object for persistence
     */
    toPersistence(): Record<string, any> {
        return {
            email: this.props.email.value,
            role: this.props.role,
            status: this.props.status,
            emailVerified: this.props.emailVerified,
            lastLoginAt: this.props.lastLoginAt,
        };
    }
}
