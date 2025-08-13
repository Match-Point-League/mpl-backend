import { Response } from 'express';
import { ApiResponse } from '../types';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import database from '../config/database';
import { Pool } from 'pg';
import { CourtValidationService } from '../services/courtValidationService';
import { CreateCourtInput, Court, SportOptions, CourtsRequestInput } from '../types';

export class CourtsController {

  private static db: Pool = database.getPool();

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
    console.error('Database error:', {
      message: error?.message,
      code: error?.code,
      detail: error?.detail,
      hint: error?.hint,
      where: error?.where,
      schema: error?.schema,
      table: error?.table,
      column: error?.column,
      dataType: error?.dataType,
      constraint: error?.constraint
    });
    
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
  private static async insertCourtIntoDatabase(insertData: CreateCourtInput & { verified: boolean; created_by: string }): Promise<{ rows: Court[] }> {
    const fieldOrder = ['name', 'address_line', 'city', 'state', 'zip_code', 'is_indoor', 'lights', 'sport', 'verified', 'created_by'];
    const values = fieldOrder.map(field => insertData[field as keyof typeof insertData]);

    // Log court insertion for debugging (remove in production)
    console.log('Inserting court data:', { fieldOrder, values, insertData });

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
  private static prepareCourtData(courtData: CourtsRequestInput, userId: string): CreateCourtInput & { verified: boolean; created_by: string } {
    return {
      name: courtData.name,
      address_line: courtData.address_line,
      city: courtData.city,
      state: courtData.state,
      zip_code: courtData.zip_code,
      is_indoor: courtData.is_indoor,
      lights: courtData.is_indoor ? undefined : courtData.lights, // Set lights to undefined for indoor courts
      sport: courtData.sport as SportOptions, 
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
        res.status(401).json(CourtsController.createErrorResponse('User authentication required', 401));
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
        res.status(400).json(CourtsController.createErrorResponse('Validation failed', 400, { validationErrors: validationResult.errors }));
        return;
      }


      // Add any warnings to the response (for future use with external validation)
      if (validationResult.warnings.length > 0) {
        // Log validation warnings (remove in production)
        console.log('Court validation warnings:', validationResult.warnings);
      }

      // Prepare court data and insert into database
      const insertData = CourtsController.prepareCourtData(courtData, req.user!.uid);
      const result = await CourtsController.insertCourtIntoDatabase(insertData);

      // Return success response with the created court
      res.status(201).json(CourtsController.createSuccessResponse(result.rows[0], 'Court created successfully'));

    } catch (error) {
      console.error('Error creating court:', error);
      CourtsController.handleDatabaseError(error, res);
    }
  }
}
