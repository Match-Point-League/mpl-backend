import { Response } from 'express';
import { ApiResponse, UserProfile } from '../types';
import database from '../config/database';
import { Pool } from 'pg';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export class UsersController {

  private static db: Pool = database.getPool();

  public static async getUserByEmail(req: AuthenticatedRequest, res: Response): Promise<void> {
    // Get the email from the authenticated user
    const email = req.user?.email;

    // Validate that the authenticated user's email matches the requested email (if provided)
    if (!req.user?.emailVerified) {
      const response: ApiResponse = {
        success: false,
        error: 'Access denied: You can only access your own user data',
        timestamp: new Date().toISOString(),
      };
      res.status(403).json(response);
      return;
    }

    try {
      // Get the user from the database
      const result = await UsersController.db.query('SELECT * FROM users WHERE email = $1', [email]);

      // If the user is not found, return a 404 error
      if (result.rows.length === 0) {
        const response: ApiResponse = {
          success: false,
          error: 'User not found',
          timestamp: new Date().toISOString(),
        };
        res.status(404).json(response);
        return;
      }

      // If the user is found, return the user
      const response: ApiResponse = {
        success: true,
        data: result.rows[0] as UserProfile,
        timestamp: new Date().toISOString(),
      };
      res.json(response);
    } catch (error) {
      // If there is an error, return a 500 error
      const response: ApiResponse = {
        success: false,
        error: 'Failed to get user by email',
        timestamp: new Date().toISOString(),
      };
      res.status(500).json(response);
    }
  }
}