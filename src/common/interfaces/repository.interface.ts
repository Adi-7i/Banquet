/**
 * Generic Repository Interface
 * Defines standard CRUD operations with soft delete support
 */
export interface IRepository<T> {
    /**
     * Create a new entity
     */
    create(data: Partial<T>): Promise<T>;

    /**
     * Find entity by ID (excludes soft-deleted records)
     */
    findById(id: string): Promise<T | null>;

    /**
     * Find all entities matching criteria (excludes soft-deleted records)
     */
    findMany(criteria?: any): Promise<T[]>;

    /**
     * Update an entity
     */
    update(id: string, data: Partial<T>): Promise<T>;

    /**
     * Soft delete an entity (sets deletedAt timestamp)
     */
    delete(id: string): Promise<T>;

    /**
     * Hard delete an entity (permanently removes from database)
     * Use with caution!
     */
    hardDelete(id: string): Promise<T>;

    /**
     * Restore a soft-deleted entity
     */
    restore(id: string): Promise<T>;

    /**
     * Count entities matching criteria
     */
    count(criteria?: any): Promise<number>;

    /**
     * Check if entity exists
     */
    exists(id: string): Promise<boolean>;
}
