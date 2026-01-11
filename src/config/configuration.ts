/**
 * Centralized configuration loader
 * Exports typed configuration objects for use throughout the application
 */
export default () => ({
    app: {
        env: process.env.NODE_ENV || 'development',
        port: parseInt(process.env.PORT || '3000', 10),
        name: process.env.APP_NAME || 'CYNERZA Backend API',
        version: process.env.APP_VERSION || '1.0.0',
    },
    database: {
        url: process.env.DATABASE_URL || '',
        poolMin: parseInt(process.env.DB_POOL_MIN || '2', 10),
        poolMax: parseInt(process.env.DB_POOL_MAX || '10', 10),
    },
    security: {
        jwt: {
            secret: process.env.JWT_SECRET || '',
            expiration: process.env.JWT_EXPIRATION || '1d',
        },
        bcrypt: {
            rounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
        },
    },
    cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || [],
        credentials: process.env.CORS_CREDENTIALS === 'true',
    },
    throttle: {
        ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
        limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
    },
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'json',
    },
    swagger: {
        enabled: process.env.SWAGGER_ENABLED === 'true',
        path: process.env.SWAGGER_PATH || 'api/docs',
    },
    health: {
        enabled: process.env.HEALTH_CHECK_ENABLED === 'true',
        diskThreshold: parseInt(process.env.DISK_THRESHOLD_PERCENT || '90', 10),
        memoryHeapThreshold: process.env.MEMORY_HEAP_THRESHOLD || '150MB',
    },
});
