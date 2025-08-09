import { Request, Response } from 'express';
import { ApiResponse, HealthCheckResponse } from '../types';
import database from '../config/database';
import { serverConfig } from '../config';

export class HealthController {
  /**
   * Comprehensive health check endpoint
   * GET /api/v1/health
   */
  public static async getHealthCheck(req: Request, res: Response): Promise<void> {
    try {      
      // Test database connection
      const dbStatus = await database.testConnection();
      
      // Calculate uptime in seconds
      const uptime = process.uptime();
      
      const healthData: HealthCheckResponse = {
        status: dbStatus.connected ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: serverConfig.environment,
        database: dbStatus,
        uptime: Math.floor(uptime),
      };

      const response: ApiResponse<HealthCheckResponse> = {
        success: true,
        data: healthData,
        message: 'Health check completed',
        timestamp: new Date().toISOString(),
      };

      const statusCode = dbStatus.connected ? 200 : 503;
      res.status(statusCode).json(response);
      
    } catch (error) {
      console.error('Health check failed:', error);
      
      const errorResponse: ApiResponse = {
        success: false,
        error: 'Health check failed',
        timestamp: new Date().toISOString(),
      };
      
      res.status(503).json(errorResponse);
    }
  }

  /**
   * Simple ping endpoint for basic connectivity testing
   * GET /api/v1/ping
   */
  public static async ping(req: Request, res: Response): Promise<void> {
    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: 'pong' },
      timestamp: new Date().toISOString(),
    };
    
    res.status(200).json(response);
  }
}