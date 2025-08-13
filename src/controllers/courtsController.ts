import { Response } from 'express';
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
      const insertData = {
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
      const fieldOrder = ['name', 'address_line', 'city', 'state', 'zip_code', 'is_indoor', 'lights', 'sport', 'verified', 'created_by'];
      const values = fieldOrder.map(field => insertData[field as keyof typeof insertData]);

      // Log court insertion for debugging (remove in production)
      console.log('Inserting court data:', { fieldOrder, values, insertData });

      const result = await CourtsController.db.query(
        `INSERT INTO courts (${fieldOrder.join(', ')}) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        values
      );

      // Return success response with the created court
      res.status(201).json(ResponseService.createSuccessResponse(result.rows[0], 'Court created successfully'));

    } catch (error) {
      console.error('Error creating court:', error);
      ResponseService.handleDatabaseError(error, res);
    }
  }

  /**
   * Retrieves a specific court by ID
   * @param req - Request with court ID in params
   * @param res - Express response object
   */
  public static async getCourtById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.query;

      // Validate that ID parameter exists
      if (!id) {
        res.status(400).json(ResponseService.createErrorResponse('Court ID is required', 400));
        return;
      }

      // Query the database for the court
      const result = await CourtsController.db.query(
        'SELECT id, name, address_line, city, state, zip_code, is_indoor, lights, sport FROM courts WHERE id = $1',
        [id]
      );

      // Check if court was found
      if (result.rows.length === 0) {
        res.status(404).json(ResponseService.createErrorResponse('Court not found', 404));
        return;
      }

      // Return the court data (already in PublicCourtResponse format)
      res.status(200).json(ResponseService.createSuccessResponse(result.rows[0], 'Court retrieved successfully'));

    } catch (error) {
      console.error('Error retrieving court:', error);
      const response = ResponseService.createErrorResponse('Failed to retrieve court', 500);
      res.status(500).json(response);
    }
  }

  /**
   * Retrieves all courts by verification status
   * @param req - Request with verification status in params
   * @param res - Express response object
   */
  public static async getCourtsByVerified(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { verified } = req.query;

      // Validate that verified parameter exists
      if (!verified) {
        res.status(400).json(ResponseService.createErrorResponse('Verification status is required', 400));
        return;
      }

      // Convert string parameter to boolean
      const isVerified = verified === 'true';

      // Query the database for courts matching verification status
      const result = await CourtsController.db.query(
        'SELECT id, name, address_line, city, state, zip_code, is_indoor, lights, sport FROM courts WHERE verified = $1',
        [isVerified]
      );

      // Return the courts array (already in PublicCourtResponse format)
      res.status(200).json(ResponseService.createSuccessResponse(result.rows, 'Courts retrieved successfully'));

    } catch (error) {
      console.error('Error retrieving courts by verification status:', error);
      const response = ResponseService.createErrorResponse('Failed to retrieve courts', 500);
      res.status(500).json(response);
    }
  }
}
  