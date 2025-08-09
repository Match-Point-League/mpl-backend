import { Request, Response } from 'express';
import { ApiResponse } from '../types';
import database from '../config/database';
import { Pool } from 'pg';
import { ErrorHandler } from '../utils/errorHandler';

export class UsersController {

  private static db: Pool = database.getPool();

  public static async getUserByEmail(req: Request, res: Response): Promise<void> {
    // Get the email from the query parameters
    const email = req.query.email as string;

    // Validate the email
    if (!email) {
      const response: ApiResponse = {
        success: false,
        error: 'Email query parameter is required',
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(response);
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
        data: result.rows[0],
        timestamp: new Date().toISOString(),
      };
      res.json(response);
    } catch (error) {
      ErrorHandler.handleControllerError(res, error, 'Failed to get user by email');
    }
  }
}