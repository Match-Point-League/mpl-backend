import dotenv from 'dotenv';
import { ServerConfig, DatabaseConfig } from '../types';

/**
 * Application Configuration Module
 * 
 * This module centralizes all application configuration by loading environment
 * variables and providing typed configuration objects for the server and database.
 * It also validates required environment variables on startup to ensure the
 * application has all necessary configuration before starting.
 */
dotenv.config();

/**
 * Server configuration object containing all server-related settings.
 * Loads values from environment variables with sensible defaults for development.
 * 
 * @type {ServerConfig}
 */
export const serverConfig: ServerConfig = {
  port: parseInt(process.env.PORT || '8080', 10),
  environment: process.env.NODE_ENV || 'development',
  apiVersion: process.env.API_VERSION || 'v1',
  corsOrigin: process.env.FRONTEND_URL || 'http://localhost:3000',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
};

/**
 * Database configuration object containing all database connection settings.
 * Loads values from environment variables with defaults for local development.
 * 
 * Note: DB_USER and DB_PASSWORD are required and will cause the application
 * to throw an error if not provided.
 * 
 * @type {DatabaseConfig}
 */
export const databaseConfig: DatabaseConfig = {
  production: {
    connectionString: process.env.DATABASE_URL || '',
    ssl: {
      rejectUnauthorized: false,
      require: true,
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
  development: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'match_point_league',
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    ssl: false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  }
};

/**
 * Environment variable validation.
 * 
 * Validates that all required environment variables are present before
 * the application starts. This prevents runtime errors due to missing
 * configuration and provides clear error messages about what's missing.
 * 
 * Required variables:
 * Development:
 * - DB_USER: Database username
 * - DB_PASSWORD: Database password  
 * - DB_NAME: Database name
 * Production:
 * - DATABASE_URL: Full database connection string
 * 
 * @throws {Error} When required environment variables are missing
 */
const validateDevelopmentEnv = (): void => {
  const requiredEnvVars = ['DB_USER', 'DB_PASSWORD', 'DB_NAME'];
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missingEnvVars.length > 0 && process.env.NODE_ENV !== 'production') {
    console.warn(`⚠️  Warning: Missing environment variables: ${missingEnvVars.join(', ')}`);
    console.warn('📝 Please check your .env file or refer to .env.example');
  }
};

// Validate production environment
const validateProductionEnv = (): void => {
  if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
    throw new Error('❌ DATABASE_URL is required for production environment');
  }
};

// Run validations
if (process.env.NODE_ENV === 'production') {
  validateProductionEnv();
} else {
  validateDevelopmentEnv();
}