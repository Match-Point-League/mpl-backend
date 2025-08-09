import { Response } from 'express';
import { ApiResponse } from '../types';

/**
 * Standardized error handling utility for controllers
 */
export class ErrorHandler {
  /**
   * Handle controller errors with consistent logging and response format
   */
  static handleControllerError(
    res: Response, 
    error: any, 
    errorMessage: string, 
    statusCode: number = 500
  ): void {
    console.error(`${errorMessage}:`, error);
    
    const response: ApiResponse = {
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    };
    
    res.status(statusCode).json(response);
  }

  /**
   * Handle validation errors with consistent response format
   */
  static handleValidationError(
    res: Response, 
    error: any, 
    validationErrors?: any
  ): void {
    console.error('Validation error:', error);
    
    const response: ApiResponse = {
      success: false,
      error: error.message || 'Validation failed',
      data: validationErrors ? { validationErrors } : undefined,
      timestamp: new Date().toISOString(),
    };
    
    res.status(400).json(response);
  }
} 