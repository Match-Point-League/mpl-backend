/**
 * Database configuration parameters.
 * 
 * Contains all necessary connection parameters for PostgreSQL database.
 * Used by the database connection manager to establish and maintain
 * database connections.
 */
export interface DatabaseConfig {
  development: DatabaseConnectionOptions;
  production: DatabaseConnectionOptions;
}

/**
 * Database connection options.
 * 
 * Contains all necessary connection parameters for PostgreSQL database.
 * Used by the database connection manager to establish and maintain
 * database connections.
 */
export interface DatabaseConnectionOptions {
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  connectionString?: string;
  ssl?: boolean | {
    rejectUnauthorized: boolean;
    require?: boolean;
    ca?: string;
    cert?: string;
    key?: string;
  };
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

export type DatabaseEnvironment = 'development' | 'production';
