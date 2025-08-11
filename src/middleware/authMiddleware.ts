import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { ApiResponse } from '../types';

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