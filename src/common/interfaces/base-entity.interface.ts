/**
 * Base entity interface
 * Defines common fields for all domain entities
 */
export interface BaseEntity {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
    createdBy?: string | null;
    updatedBy?: string | null;
}
