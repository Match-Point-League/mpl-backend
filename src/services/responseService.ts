/**
 * Response service for the Match Point League application
 * 
 * This service handles creating standardized API responses and handling common error scenarios
 */

import { ApiResponse } from '../types';

export class ResponseService {
  /**
   * Creates a standardized success response
   * @param data - The data to include in the response
   * @param message - Optional success message
   * @returns Formatted success response
   */
  public static createSuccessResponse<T>(data: T, message?: string): ApiResponse<T> {
    return {
      success: true,
      message: message || 'Operation completed successfully',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Creates a standardized error response
   * @param error - The error message
   * @param statusCode - Optional HTTP status code
   * @param data - Optional additional data (like validation errors)
   * @returns Formatted error response
   */
  public static createErrorResponse<T = any>(
    error: string, 
    statusCode?: number, 
    data?: T
  ): ApiResponse<T> {
    return {
      success: false,
      error,
      data,
      timestamp: new Date().toISOString(),
    };
  }

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

    res.status(statusCode).json(
      ResponseService.createErrorResponse(errorMessage, statusCode)
    );
  }
}
