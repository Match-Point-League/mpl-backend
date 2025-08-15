import { Response, Request } from 'express';
import { CourtsRequestInput, CreateCourtInput, Court, SportOptions, ApiResponse, UpdateCourtInput } from '../types';
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

  /**
   * Retrieves a specific court by ID
   * @param req - Request with court ID in params
   * @param res - Express response object
   */
  public static async getCourtById(req: Request, res: Response): Promise<void> {
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
  public static async getCourtsByVerified(req: Request, res: Response): Promise<void> {
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

  /**
   * Retrieves all verified courts only
   * @param req - Request object
   * @param res - Express response object
   */
  public static async getOnlyVerifiedCourts(req: Request, res: Response): Promise<void> {
    try {
      // Create a mock request object with verified=true for the existing method
      const mockReq = { query: { verified: 'true' } } as unknown as Request;
      
      // Call the existing method with the mock request
      await CourtsController.getCourtsByVerified(mockReq, res);
      
    } catch (error) {
      console.error('Error retrieving verified courts:', error);
      const response = ResponseService.createErrorResponse('Failed to retrieve verified courts', 500);
      res.status(500).json(response);
    }
  }

  /**
   * Retrieves a specific verified court by ID
   * @param req - Request with court ID in params
   * @param res - Express response object
   */
  public static async getVerifiedCourtById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Validate that ID parameter exists
      if (!id) {
        res.status(400).json(ResponseService.createErrorResponse('Court ID is required', 400));
        return;
      }

      // Query the database for the verified court
      const result = await CourtsController.db.query(
        'SELECT id, name, address_line, city, state, zip_code, is_indoor, lights, sport FROM courts WHERE id = $1 AND verified = true',
        [id]
      );

      // Check if verified court was found
      if (result.rows.length === 0) {
        res.status(404).json(ResponseService.createErrorResponse('Verified court not found', 404));
        return;
      }

      // Return the verified court data
      res.status(200).json(ResponseService.createSuccessResponse(result.rows[0], 'Verified court retrieved successfully'));

    } catch (error) {
      console.error('Error retrieving verified court:', error);
      const response = ResponseService.createErrorResponse('Failed to retrieve verified court', 500);
      res.status(500).json(response);
    }
  }

  /**
   * Updates an existing court
   * @param req - The authenticated request object with court update data
   * @param res - The response object
   * @returns void
   */
  public static async updateCourt(req: AuthenticatedRequest, res: Response): Promise<void> {
    const updateData: UpdateCourtInput = req.body;

    // Validate the update data
    const validationResult = await CourtValidationService.validateCourtUpdateData(updateData);
    if (!validationResult.isValid) {
      res.status(400).json(ResponseService.createErrorResponse('Invalid update data', 400, { validationErrors: validationResult.errors }));
      return;
    }

    // Collect warnings from validation service
    const warnings = [...validationResult.warnings];

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
        res.status(400).json(ResponseService.createErrorResponse('No valid fields to update', 400));
        return;
      }

      // Get court ID from request parameters
      values.push(req.params.id);

      // Update the court
      const query = `
        UPDATE courts 
        SET ${updateFields.join(', ')} 
        WHERE id = $${paramIndex}
        RETURNING id, name, address_line, city, state, zip_code, is_indoor, lights, sport, verified, created_by, created_at, updated_at
      `;

      const result = await CourtsController.db.query(query, values);

      // Check if the court was updated successfully
      if (result.rows.length === 0) {
        res.status(404).json(ResponseService.createErrorResponse('Court not found', 404));
        return;
      }

      // Return the updated court
      const responseData = {
        court: result.rows[0],
        warnings: warnings.length > 0 ? warnings : undefined
      };
      
      res.status(200).json(ResponseService.createSuccessResponse(responseData, 'Court updated successfully'));

    } catch (error) {
      console.error('Update court error:', error);
      res.status(500).json(ResponseService.createErrorResponse('Failed to update court', 500));
    }
  }
}
  