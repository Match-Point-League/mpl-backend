import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { ApiResponse, UserRole } from '../types';
import database from '../config/database';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email: string;
    displayName?: string;
    emailVerified: boolean;
  };
}

/**
 * Middleware to authenticate requests using Firebase ID token
 */
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const response: ApiResponse = {
        success: false,
        error: 'Authorization header required',
        timestamp: new Date().toISOString(),
      };
      res.status(401).json(response);
      return;
    }

    const token = authHeader.split(' ')[1];
    const user = await AuthService.verifyToken(token);

    if (!user) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid or expired token',
        timestamp: new Date().toISOString(),
      };
      res.status(401).json(response);
      return;
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Authentication failed',
      timestamp: new Date().toISOString(),
    };
    res.status(401).json(response);
  }
};

/**
 * Middleware to require admin role for protected routes
 * This middleware must be used after authenticateToken middleware
 */
export const requireAdminRole = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get the email from the authenticated user (guaranteed to exist after authenticateToken)
    const email = req.user!.email;

    // Query the database to check if the user has admin role
    const db = database.getPool();
    const result = await db.query(
      'SELECT role FROM users WHERE email = $1',
      [email]
    );

    // If the user is not found, return 403
    if (result.rows.length === 0) {
      const response: ApiResponse = {
        success: false,
        error: 'Access denied: User not found',
        timestamp: new Date().toISOString(),
      };
      res.status(403).json(response);
      return;
    }

    // Check if the user has admin role
    const userRole = result.rows[0].role;
    if (userRole !== UserRole.ADMIN) {
      const response: ApiResponse = {
        success: false,
        error: 'Access denied: Admin role required',
        timestamp: new Date().toISOString(),
      };
      res.status(403).json(response);
      return;
    }

    // User has admin role, proceed to next middleware/controller
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Failed to verify admin role',
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  }
}; 