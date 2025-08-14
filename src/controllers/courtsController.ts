import { Response, Request } from 'express';
import { CourtsRequestInput, CreateCourtInput, Court, SportOptions, ApiResponse } from '../types';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { CourtValidationService } from '../services/courtValidationService';
import { ResponseService } from '../services/responseService';
import database from '../config/database';
import { Pool } from 'pg';

export class CourtsController {

  private static db: Pool = database.getPool();



  /**
   * Main method to create a new court
   * @param req - Authenticated request with court data
   * @param res - Express response object
   */
  public static async createCourt(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Authentication check
      if (!req.user?.uid) {
        res.status(401).json(ResponseService.createErrorResponse('User authentication required', 401));
        return;
      }

      // Extract court data from request body
      const courtData: CourtsRequestInput = req.body;
      const { name, address_line, city, state, zip_code, is_indoor, lights, sport } = courtData;

      // Validate court data using our comprehensive validation service
      const validationResult = await CourtValidationService.validateCourtData({
        name,
        address_line,
        city,
        state,
        zip_code,
        is_indoor,
        lights,
        sport
      });

      if (!validationResult.isValid) {
        res.status(400).json(ResponseService.createErrorResponse('Validation failed', 400, { validationErrors: validationResult.errors }));
        return;
      }

      // Add any warnings to the response (for future use with external validation)
      if (validationResult.warnings.length > 0) {
        // Log validation warnings (remove in production)
        console.log('Court validation warnings:', validationResult.warnings);
      }

      // Prepare court data for database insertion with defaults
      const insertData : CreateCourtInput = {
        name: courtData.name,
        address_line: courtData.address_line,
        city: courtData.city,
        state: courtData.state,
        zip_code: courtData.zip_code,
        is_indoor: courtData.is_indoor,
        lights: courtData.is_indoor ? undefined : courtData.lights, // Set lights to undefined for indoor courts
        sport: courtData.sport as SportOptions, 
        verified: false, // Default to false
        created_by: req.user!.uid,
      };

      // Insert court data into the database
      const fieldNames = Object.keys(insertData);
      const values = Object.values(insertData);

      // Log court insertion for debugging (remove in production)
      console.log('Inserting court data:', { fieldNames, values, insertData });

      const result = await CourtsController.db.query(
        `INSERT INTO courts (${fieldNames.join(', ')}) VALUES (${fieldNames.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`,
        values
      );

      // Return success response with the created court
      res.status(201).json(ResponseService.createSuccessResponse(result.rows[0], 'Court created successfully'));

    } catch (error) {
      console.error('Error creating court:', error);
      ResponseService.handleDatabaseError(error, res);
    }
  }
}