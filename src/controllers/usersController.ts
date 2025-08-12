import { Response } from 'express';
import { ApiResponse, UserProfile, UpdateUserInput } from '../types';
import database from '../config/database';
import { Pool } from 'pg';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export class UsersController {

  private static db: Pool = database.getPool();

  /**
   * Get the user by email
   * @param req - The authenticated request object
   * @param res - The response object
   * @returns void
   */
  public static async getUser(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const result = await UsersController.db.query(
        'SELECT id, email, name, display_name, skill_level, preferred_sport, is_competitive, city, zip_code, allow_direct_contact FROM users WHERE email = $1', 
        [email]
      );

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

  /**
   * Update the user profile
   * @param req - The authenticated request object
   * @param res - The response object
   * @returns void
   */
  public static async updateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    const updateData: UpdateUserInput = req.body;

    // Validate that the authenticated user's email is verified
    if (!req.user?.emailVerified) {
      const response: ApiResponse = {
        success: false,
        error: 'Access denied: Email must be verified',
        timestamp: new Date().toISOString(),
      };
      res.status(403).json(response);
      return;
    }

    try {
      // Prepare the update fields and values
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      for (const [field, value] of Object.entries(updateData)) {
        if (value !== undefined) {
          updateFields.push(`${field} = $${paramIndex++}`);
          values.push(value);
        }
      }

      // Validate that there are fields to update
      if (updateFields.length === 0) {
        const response: ApiResponse = {
          success: false,
          error: 'No valid fields to update',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      values.push(req.user.email);

      // Update the user profile
      const query = `
        UPDATE users 
        SET ${updateFields.join(', ')} 
        WHERE email = $${paramIndex}
        RETURNING id, email, name, display_name, skill_level, preferred_sport, is_competitive, city, zip_code, allow_direct_contact
      `;

      const result = await UsersController.db.query(query, values);

      // Check if the user was updated successfully
      if (result.rows.length === 0) {
        const response: ApiResponse = {
          success: false,
          error: 'User not found',
          timestamp: new Date().toISOString(),
        };
        res.status(404).json(response);
        return;
      }

      // Return the updated user profile
      const response: ApiResponse = {
        success: true,
        data: result.rows[0] as UserProfile,
        message: 'User profile updated successfully',
        timestamp: new Date().toISOString(),
      };
      res.json(response);
    } catch (error) {
      console.error('Update user profile error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to update user profile',
        timestamp: new Date().toISOString(),
      };
      res.status(500).json(response);
    }
  }
}