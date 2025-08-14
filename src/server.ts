import { createApp } from './app';
import { serverConfig } from './config';
import database from './config/database';

/**
 * Application Server Entry Point
 * 
 * This module serves as the main entry point for the Express.js application.
 * It handles server startup, database connection validation, graceful shutdown,
 * and process signal handling.
 * 
 * Startup Sequence:
 * 1. Test database connection
 * 2. Create Express application
 * 3. Start HTTP server
 * 4. Display startup information
 * 
 * Graceful Shutdown:
 * - Handles SIGTERM and SIGINT signals
 * - Closes database connections
 * - Exits process cleanly
 */

// Global error handlers to prevent server crashes
process.on('uncaughtException', (error) => {
  console.error('❌ [CRITICAL] Uncaught Exception:', error);
  console.error('📝 [CRITICAL] Error details:', {
    name: error.name,
    message: error.message,
    stack: error.stack
  });
  // Don't exit immediately, let the server try to continue
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ [CRITICAL] Unhandled Promise Rejection:', reason);
  console.error('📝 [CRITICAL] Promise:', promise);
  // Don't exit immediately, let the server try to continue
});

/**
 * Starts the application server with proper initialization and error handling.
 * 
 * @returns {Promise<void>} Promise that resolves when server starts successfully
 * 
 * @throws {Error} When database connection fails or server fails to start
 */
const startServer = async (): Promise<void> => {
  try {
    // Test database connection before starting server
    const dbStatus = await database.testConnection();
    if (!dbStatus.connected) {
      throw new Error('Failed to connect to database');
    }
    console.log('✅ Database connection established successfully');

    // Create and start Express app
    const app = createApp();
    
    app.listen(serverConfig.port, () => {
      console.log(`🚀 Server running on port ${serverConfig.port}`);
      console.log(`📍 Environment: ${serverConfig.environment}`);
      console.log(`🔗 API Base URL: http://localhost:${serverConfig.port}/api/${serverConfig.apiVersion}`);
      console.log(`💚 Health Check: http://localhost:${serverConfig.port}/api/${serverConfig.apiVersion}/health`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await database.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  await database.close();
  process.exit(0);
});

/**
 * Start the server when this module is executed.
 * 
 * This automatically starts the server when the module is imported or
 * when the application is launched via npm start or node server.js.
 */
startServer();