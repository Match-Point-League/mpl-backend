import { Response } from 'express';
import { ApiResponse, CreateMatchInput } from '../types';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import database from '../config/database';
import { Pool } from 'pg';

export class MatchesController {
  private static db: Pool = database.getPool();

  public static async createMatch(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { player1_id, player2_id, match_type, sport, match_time, court_id }: CreateMatchInput = req.body;

    // Validate required fields
    if (!player1_id || !player2_id || !match_type || !sport || !match_time || !court_id) {
      const response: ApiResponse = {
        success: false,
        error: 'All fields are required: player1_id, player2_id, match_type, sport, match_time, court_id',
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(response);
      return;
    }

    // Get the authenticated user's ID
    if (!req.user?.emailVerified) {
      const response: ApiResponse = {
        success: false,
        error: 'User authentication required',
        timestamp: new Date().toISOString(),
      };
      res.status(401).json(response);
      return;
    }

    try {
      // Verify that player2_id exists in the users table
      const userCheck = await MatchesController.db.query(
        'SELECT id FROM users WHERE id = $1',
        [player2_id]
      );

      if (userCheck.rows.length === 0) {
        const response: ApiResponse = {
          success: false,
          error: 'Player 2 does not exist',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      // Create the match
      const result = await MatchesController.db.query(
        `INSERT INTO matches (player1_id, player2_id, match_type, sport, match_time, court_id, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [player1_id, player2_id, match_type, sport, match_time, court_id, player1_id]
      );

      const response: ApiResponse = {
        success: true,
        data: result.rows[0],
        message: 'Match created successfully',
        timestamp: new Date().toISOString(),
      };
      res.status(201).json(response);
    } catch (error) {
      console.error('Error creating match:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Failed to create match',
        timestamp: new Date().toISOString(),
      };
      res.status(500).json(response);
    }
  }
}