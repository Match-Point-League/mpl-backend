import dotenv from 'dotenv';
import { ServerConfig, DatabaseConfig } from '../types';

/**
 * Application Configuration Module
 * 
 * This module centralizes all application configuration by loading environment
 * variables and providing typed configuration objects for the server and database.
 * It also validates required environment variables on startup to ensure the
 * application has all necessary configuration before starting.
 * 
 * Environment Variables:
 * 
 * Server Configuration:
 * - PORT: Server port (default: 8080)
 * - NODE_ENV: Environment mode (default: development)
 * - API_VERSION: API version prefix (default: v1)
 * - FRONTEND_URL: CORS origin for frontend (default: http://localhost:3000)
 * - RATE_LIMIT_WINDOW_MS: Rate limiting window in milliseconds (default: 900000)
 * - RATE_LIMIT_MAX_REQUESTS: Max requests per window (default: 100)
 * 
 * Database Configuration:
 * - DATABASE_URL: Full database connection string (optional, uses individual params if not provided)
 * - DB_HOST: Database host (default: localhost)
 * - DB_PORT: Database port (default: 5432)
 * - DB_NAME: Database name (default: match_point_league)
 * - DB_USER: Database username (required)
 * - DB_PASSWORD: Database password (required)
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
  url: process.env.DATABASE_URL || '',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'match_point_league',
  username: process.env.DB_USER || '',
  password: process.env.DB_PASSWORD || '',
};

/**
 * Environment variable validation.
 * 
 * Validates that all required environment variables are present before
 * the application starts. This prevents runtime errors due to missing
 * configuration and provides clear error messages about what's missing.
 * 
 * Required variables:
 * - DB_USER: Database username
 * - DB_PASSWORD: Database password  
 * - DB_NAME: Database name
 * 
 * @throws {Error} When required environment variables are missing
 */
const requiredEnvVars = ['DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}