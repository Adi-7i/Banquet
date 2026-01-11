import * as Joi from 'joi';

/**
 * Environment variable validation schema
 * Ensures all required configuration is present and valid at application startup
 */
export const envValidationSchema = Joi.object({
    // Application
    NODE_ENV: Joi.string()
        .valid('development', 'staging', 'production', 'test')
        .required(),
    PORT: Joi.number().default(3000),
    APP_NAME: Joi.string().required(),
    APP_VERSION: Joi.string().required(),

    // Database
    DATABASE_URL: Joi.string().required(),
    DB_POOL_MIN: Joi.number().default(2),
    DB_POOL_MAX: Joi.number().default(10),

    // Security
    JWT_SECRET: Joi.string().min(32).required(),
    JWT_EXPIRATION: Joi.string().default('1d'),
    BCRYPT_ROUNDS: Joi.number().min(10).max(15).default(10),

    // CORS
    CORS_ORIGIN: Joi.string().required(),
    CORS_CREDENTIALS: Joi.boolean().default(true),

    // Rate Limiting
    THROTTLE_TTL: Joi.number().default(60),
    THROTTLE_LIMIT: Joi.number().default(100),

    // Logging
    LOG_LEVEL: Joi.string()
        .valid('error', 'warn', 'info', 'debug', 'verbose')
        .default('info'),
    LOG_FORMAT: Joi.string().valid('json', 'pretty').default('json'),

    // Swagger
    SWAGGER_ENABLED: Joi.boolean().default(false),
    SWAGGER_PATH: Joi.string().default('api/docs'),

    // Health Check
    HEALTH_CHECK_ENABLED: Joi.boolean().default(true),
    DISK_THRESHOLD_PERCENT: Joi.number().min(0).max(100).default(90),
    MEMORY_HEAP_THRESHOLD: Joi.string().default('150MB'),
});
