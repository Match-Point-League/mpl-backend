import { Request, Response } from 'express';
import { ApiResponse } from '../types';
import database from '../config/database';
import { Pool } from 'pg';

export class UsersController {

  private db: Pool;

  constructor() {
    this.db = database.getPool();
  }

  public async getUserByEmail(req: Request, res: Response): Promise<void> {
    // Get the email from the request parameters
    const email = req.params.email;

    // Validate the email
    if (!email) {
      const response: ApiResponse = {
        success: false,
        error: 'Email is required',
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(response);
      return;
    }

    try {
      // Get the user from the database
      const result = await this.db.query('SELECT * FROM users WHERE email = $1', [email]);

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