import { Pool } from 'pg';
import { databaseConfig } from './index';

/**
 * Database connection manager using the Singleton pattern.
 * 
 * This class provides a centralized way to manage PostgreSQL database connections
 * using connection pooling. It implements the Singleton pattern to ensure only
 * one database instance exists throughout the application lifecycle.
 * 
 * Features:
 * - Connection pooling with configurable pool size
 * - Automatic connection error handling
 * - Connection testing with latency measurement
 * - Graceful shutdown capabilities
 */
export class Database {
  private static instance: Database;
  /** PostgreSQL connection pool */
  private pool: Pool;

  /**
   * Initializes the PostgreSQL connection pool with configuration from databaseConfig.
   * 
   * Pool configuration:
   * - max: 20 concurrent connections
   * - idleTimeoutMillis: 30 seconds (connections are closed after 30s of inactivity)
   * - connectionTimeoutMillis: 2 seconds (timeout for establishing new connections)
   */
  private constructor() {
    // Configure SSL for production (Render) vs development
    const isProduction = process.env.NODE_ENV === 'production';
    
    const poolConfig: any = {
      connectionString: databaseConfig.url,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ssl: isProduction ? {
        rejectUnauthorized: false,
        require: true
      } : false
    };

    // If individual connection params are provided, use them instead
    if (!databaseConfig.url || databaseConfig.url === '') {
      delete poolConfig.connectionString;
      Object.assign(poolConfig, {
        host: databaseConfig.host,
        port: databaseConfig.port,
        database: databaseConfig.database,
        user: databaseConfig.username,
        password: databaseConfig.password,
      });
    }

    this.pool = new Pool(poolConfig);

    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });

    this.pool.on('connect', () => {
      console.log('✅ Database client connected');
    });
  }

  /**
   * Gets the singleton instance of the Database class.
   * Creates a new instance if one doesn't exist (lazy initialization).
   * 
   * @returns {Database} The singleton Database instance
   */
  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  /**
   * Returns the PostgreSQL connection pool.
   * Use this method to get the pool for executing queries.
   * 
   * @returns {Pool} The PostgreSQL connection pool
   */
  public getPool(): Pool {
    return this.pool;
  }

  /**
   * Tests the database connection and measures response latency.
   * Executes a simple SELECT query to verify connectivity.
   * 
   * @returns {Promise<{ connected: boolean; latency?: number }>} Connection status and latency
   */
  public async testConnection(): Promise<{ connected: boolean; latency?: number }> {
    try {
      const start = Date.now();
      await this.pool.query('SELECT 1');
      const latency = Date.now() - start;
      return { connected: true, latency };
    } catch (error) {
      console.error('❌ Database connection test failed:', error);
      return { connected: false };
    }
  }

  /**
   * Gracefully closes all database connections in the pool.
   * This method should be called during application shutdown to ensure
   * all connections are properly closed and resources are released.
   * 
   * @returns {Promise<void>} Promise that resolves when all connections are closed
   */
  public async close(): Promise<void> {
    await this.pool.end();
  }
}

// Default export of the Database singleton instance.
export default Database.getInstance();