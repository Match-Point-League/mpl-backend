import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

/**
 * Extended Error interface for application-specific error handling.
 * 
 * Adds status code and operational error flags to the standard Error interface
 * for better error categorization and HTTP response handling.
 */
export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Global error handling middleware for Express applications.
 * 
 * This middleware catches all errors thrown in the application and provides
 * consistent error responses. It handles both operational errors (expected)
 * and programming errors (unexpected), with different behavior in development
 * and production environments.
 * 
 * @param err - The error object that was thrown
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function (unused in error handlers)
 */
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';
  
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  const errorResponse: ApiResponse = {
    success: false,
    error: isProduction ? 'Internal server error' : err.message,
    timestamp: new Date().toISOString(),
  };

  // Add stack trace in development
  if (!isProduction && err.stack) {
    (errorResponse as any).stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * 404 Not Found handler for unmatched routes.
 * 
 * This middleware handles requests to routes that don't exist in the application.
 * It provides a consistent error response format and should be placed after
 * all other route handlers to catch unmatched requests.
 * 
 * @param req - Express request object
 * @param res - Express response object
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  const response: ApiResponse = {
    success: false,
    error: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
  };
  
  res.status(404).json(response);
};