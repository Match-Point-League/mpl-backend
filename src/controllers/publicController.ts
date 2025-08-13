import { Request, Response } from 'express';
import { ApiResponse } from '../types';
import { SportOptions } from '../types/userTypes';
import database from '../config/database';
import { Pool } from 'pg';

export class PublicUserController {

  private static db: Pool = database.getPool();

  public static async getPlayersBySport(req: Request, res: Response): Promise<void> {
    const sport = req.params.sport as string;

    // Validate that the sport is provided
    if (!sport) {
      const response: ApiResponse = {
        success: false,
        error: 'Sport parameter is required',
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(response);
      return;
    }

    // Validate that the sport is a valid option
    if (!Object.values(SportOptions).includes(sport as SportOptions)) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid sport: Must be tennis, pickleball, or both',
        timestamp: new Date().toISOString(),
      };
      res.status(400).json(response);
      return;
    }

    try {
      let queryParams: string[];
      const baseQuery = `
        SELECT id, name, email, display_name, skill_level, preferred_sport, is_competitive, city, zip_code, allow_direct_contact
        FROM users 
        WHERE preferred_sport ${sport.toLowerCase() === 'both' ? '= $1' : 'IN ($1, $2)'}
        ORDER BY display_name ASC
      `;

      switch (sport.toLowerCase()) {
        case SportOptions.BOTH:
          queryParams = [SportOptions.BOTH];
          break;
        case SportOptions.PICKLEBALL:
          queryParams = [SportOptions.PICKLEBALL, SportOptions.BOTH];
          break;
        case SportOptions.TENNIS:
          queryParams = [SportOptions.TENNIS, SportOptions.BOTH];
          break;
        default:
          throw new Error('Invalid sport');
      }

      const result = await PublicUserController.db.query(baseQuery, queryParams);

      const response: ApiResponse = {
        success: true,
        data: result.rows.map((row) => ({
          id: row.id,
          name: row.name,
          ...(row.allow_direct_contact && {email: row.email}),
          display_name: row.display_name,
          skill_level: row.skill_level,
          preferred_sport: row.preferred_sport,
          is_competitive: row.is_competitive,
          city: row.city,
          zip_code: row.zip_code,
        })),
        timestamp: new Date().toISOString(),
      };
      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch players',
        timestamp: new Date().toISOString(),
      };
      res.status(500).json(response);
    }
  }
}