/**
 * Application Type Definitions
 * 
 * This module contains all TypeScript interfaces and types used throughout
 * the application. These types ensure type safety and provide clear contracts
 * for API responses, configuration objects, and data structures.
 */

/**
 * Standard API response wrapper for all HTTP endpoints.
 * 
 * This interface provides a consistent structure for all API responses,
 * including success/failure status, data payload, error messages, and
 * timestamp for tracking response timing.
 * 
 * @template T - The type of data payload (defaults to any)
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

/**
 * Health check endpoint response structure.
 * 
 * Provides comprehensive system status information including database
 * connectivity, application uptime, and environment details.
 */
export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  version: string;
  environment: string;
  database: {
    connected: boolean;
    latency?: number;
  };
  uptime: number;
}

/**
 * Server configuration parameters.
 * 
 * Contains all server-related settings including port, environment,
 * API versioning, CORS configuration, and rate limiting parameters.
 */
export interface ServerConfig {
  port: number;
  environment: string;
  apiVersion: string;
  corsOrigin: string;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
}

export * from './databaseTypes';
export * from './userTypes';
export * from './courtTypes';
export * from './matchTypes';
export * from './authTypes';
export * from './registrationTypes';
export * from './validationTypes';
