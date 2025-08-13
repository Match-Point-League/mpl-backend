import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { ApiResponse, UserRole } from '../types';
import database from '../config/database';
import { Pool } from 'pg';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email: string;
    displayName?: string;
    emailVerified: boolean;
    role?: UserRole;
  };
}

/**
 * Get user role from database by email
 */
async function getUserRole(email: string): Promise<UserRole | null> {
  try {
    const db = database.getPool();
    const result = await db.query('SELECT role FROM users WHERE email = $1', [email]);
    
    if (result.rows.length > 0) {
      return result.rows[0].role as UserRole;
    }
    return null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
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

    // Get user role from database
    const userRole = await getUserRole(user.email);
    
    // Attach user with role to request object
    req.user = {
      ...user,
      role: userRole || UserRole.PLAYER // Default to PLAYER if role not found
    };
    
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
 * Middleware to require admin role (admin or superadmin)
 */
export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    const response: ApiResponse = {
      success: false,
      error: 'Authentication required',
      timestamp: new Date().toISOString(),
    };
    res.status(401).json(response);
    return;
  }

  if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.SUPERADMIN) {
    const response: ApiResponse = {
      success: false,
      error: 'Admin access required',
      timestamp: new Date().toISOString(),
    };
    res.status(403).json(response);
    return;
  }

  next();
};

/**
 * Middleware to require superadmin role
 */
export const requireSuperAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    const response: ApiResponse = {
      success: false,
      error: 'Authentication required',
      timestamp: new Date().toISOString(),
    };
    res.status(401).json(response);
    return;
  }

  if (req.user.role !== UserRole.SUPERADMIN) {
    const response: ApiResponse = {
      success: false,
      error: 'Superadmin access required',
      timestamp: new Date().toISOString(),
    };
    res.status(403).json(response);
    return;
  }

  next();
};

/**
 * Utility function to check if a user has a specific role
 * Can be used in route handlers for more granular access control
 */
export const hasRole = (userRole: UserRole, requiredRole: UserRole): boolean => {
  const roleHierarchy = {
    [UserRole.PLAYER]: 1,
    [UserRole.ADMIN]: 2,
    [UserRole.SUPERADMIN]: 3,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}; 