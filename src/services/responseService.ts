/**
 * Response service for the Match Point League application
 * 
 * This service handles creating standardized API responses and handling common error scenarios
 */

import { ApiResponse } from '../types';

export class ResponseService {
  /**
   * Handles database errors and returns appropriate error messages
   * @param error - The database error object
   * @param res - Express response object
   */
  public static handleDatabaseError(error: any, res: any): void {
    console.error('Database error:', error);
    
    let errorMessage = 'Database operation failed';
    let statusCode = 500;

    // Handle specific database error types
    if (error.code) {
      switch (error.code) {
        case '23505': // Unique violation
          errorMessage = 'A record with this information already exists';
          statusCode = 409;
          break;
        case '23502': // Not null violation
          errorMessage = 'Required information is missing';
          statusCode = 400;
          break;
        case '23514': // Check violation
          errorMessage = 'Invalid data provided';
          statusCode = 400;
          break;
        case '08000': // Connection exception
          errorMessage = 'Database connection error';
          statusCode = 503;
          break;
        default:
          errorMessage = 'Database error occurred';
          statusCode = 500;
      }
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
}
