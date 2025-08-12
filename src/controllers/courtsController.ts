import { Response } from 'express';
import { ApiResponse } from '../types';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import database from '../config/database';
import { Pool } from 'pg';
import { CourtValidationService } from '../services/courtValidationService';

export class CourtsController {

  private static db: Pool = database.getPool();

  /**
   * Validates the lights field based on indoor/outdoor status
   * @param isIndoor - Whether the court is indoor
   * @param lights - The lights value to validate
   * @returns Error message if validation fails, undefined if valid
   */
  private static validateLightsField(isIndoor: boolean, lights: boolean | undefined): string | undefined {
    if (isIndoor && lights !== undefined) {
      return 'Lights field is not applicable for indoor courts';
    }
    
    if (!isIndoor && (lights === undefined || lights === null)) {
      return 'Lights field is required for outdoor courts';
    }
    
    return undefined; // Validation passed
  }

  /**
   * Creates an error response with consistent format
   * @param error - Error message
   * @param statusCode - HTTP status code (default: 400)
   * @param data - Additional data to include
   * @returns Formatted error response
   */
  private static createErrorResponse(error: string, statusCode: number = 400, data?: any): ApiResponse {
    return {
      success: false,
      error,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Creates a success response with consistent format
   * @param data - Response data
   * @param message - Success message
   * @returns Formatted success response
   */
  private static createSuccessResponse(data: any, message: string): ApiResponse {
    return {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Handles database-specific errors and returns appropriate responses
   * @param error - Database error object
   * @param res - Express response object
   */
  private static handleDatabaseError(error: any, res: Response): void {
    if (error && typeof error === 'object' && 'code' in error) {
      const errorCodeMap = {
        '23503': 'Invalid user reference',
        '23514': 'Invalid sport value. Must be one of: tennis, pickleball, both'
      };
      
      const errorMessage = errorCodeMap[error.code as keyof typeof errorCodeMap];
      if (errorMessage) {
        const response = this.createErrorResponse(errorMessage, 400);
        res.status(400).json(response);
        return;
      }
    }
    
    const response = this.createErrorResponse('Failed to create court', 500);
    res.status(500).json(response);
  }

  /**
   * Inserts court data into the database
   * @param insertData - Court data to insert
   * @returns Database query result
   */
  private static async insertCourtIntoDatabase(insertData: any): Promise<any> {
    const fieldOrder = ['name', 'address_line', 'city', 'state', 'zip_code', 'is_indoor', 'lights', 'sport', 'verified', 'created_by'];
    const values = fieldOrder.map(field => insertData[field as keyof typeof insertData]);

    return await CourtsController.db.query(
      `INSERT INTO courts (${fieldOrder.join(', ')}) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      values
    );
  }

  /**
   * Prepares court data for database insertion with defaults
   * @param courtData - Raw court data from request
   * @param userId - ID of the authenticated user
   * @returns Prepared court data for database
   */
  private static prepareCourtData(courtData: any, userId: string): any {
    return {
      name: courtData.name,
      address_line: courtData.address_line,
      city: courtData.city,
      state: courtData.state,
      zip_code: courtData.zip_code,
      is_indoor: courtData.is_indoor,
      lights: courtData.is_indoor ? null : courtData.lights, // Set lights to null for indoor courts
      sport: courtData.sport, // Use the sport provided by user
      verified: false, // Default to false
      created_by: userId,
    };
  }

  /**
   * Main method to create a new court
   * @param req - Authenticated request with court data
   * @param res - Express response object
   */
  public static async createCourt(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Authentication check
      if (!req.user?.uid) {
        res.status(401).json(this.createErrorResponse('User authentication required', 401));
        return;
      }

      // Extract court data from request body
      const { name, address_line, city, state, zip_code, is_indoor, lights, sport } = req.body;

      // Validate court data using our comprehensive validation service
      const validationResult = CourtValidationService.validateCourtData({
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
        res.status(400).json(this.createErrorResponse('Validation failed', 400, { validationErrors: validationResult.errors }));
        return;
      }

      // Validate lights field logic (business rule validation)
      const lightsValidationError = this.validateLightsField(is_indoor, lights);
      if (lightsValidationError) {
        res.status(400).json(this.createErrorResponse(lightsValidationError));
        return;
      }

      // Add any warnings to the response (for future use with external validation)
      if (validationResult.warnings.length > 0) {
        console.log('Court validation warnings:', validationResult.warnings);
      }

      // Prepare court data and insert into database
      const insertData = this.prepareCourtData({ name, address_line, city, state, zip_code, is_indoor, lights, sport }, req.user.uid);
      const result = await this.insertCourtIntoDatabase(insertData);

      // Return success response with the created court
      res.status(201).json(this.createSuccessResponse(result.rows[0], 'Court created successfully'));

    } catch (error) {
      console.error('Error creating court:', error);
      this.handleDatabaseError(error, res);
    }
  }
}
