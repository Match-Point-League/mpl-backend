import { Response, Request } from 'express';
import { CourtsRequestInput, CreateCourtInput, Court, SportOptions, ApiResponse, UpdateCourtInput } from '../types';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { CourtValidationService } from '../services/courtValidationService';
import { ResponseService } from '../services/responseService';
import database from '../config/database';
import { Pool } from 'pg';
import { fetchCourtsByVerifiedStatus } from '../utils/courtUtils';

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
        res.status(401).json({
        success: false,
        error: 'User authentication required',
        timestamp: new Date().toISOString()
      });
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
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          data: { validationErrors: validationResult.errors },
          timestamp: new Date().toISOString()
        });
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
      res.status(201).json({
        success: true,
        message: 'Court created successfully',
        data: result.rows[0],
        timestamp: new Date().toISOString()
      });

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
        res.status(400).json({
          success: false,
          error: 'Court ID is required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Query the database for the court
      const result = await CourtsController.db.query(
        'SELECT id, name, address_line, city, state, zip_code, is_indoor, lights, sport FROM courts WHERE id = $1',
        [id]
      );

      // Check if court was found
      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Court not found',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Return the court data (already in PublicCourtResponse format)
      res.status(200).json({
        success: true,
        message: 'Court retrieved successfully',
        data: result.rows[0],
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error retrieving court:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve court',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Retrieves all courts by verification status
   * admin endpoint
   * @param req - Request with verification status in params
   * @param res - Express response object
   */
  public static async getCourtsByVerified(req: Request, res: Response): Promise<void> {
    try {
      const { verified } = req.query;

      // Validate that verified parameter exists
      if (!verified) {
        res.status(400).json({
          success: false,
          error: 'Verification status is required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Convert string parameter to boolean
      const isVerified = verified === 'true';

      // Use utility function to fetch courts with creator information (admin endpoint)
      const courts = await fetchCourtsByVerifiedStatus(isVerified, true);

      // Return the courts array
      res.status(200).json({
        success: true,
        message: 'Courts retrieved successfully',
        data: courts,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error retrieving courts by verification status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve courts',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Retrieves all verified courts only
   * public endpoint
   * @param req - Request object
   * @param res - Express response object
   */
  public static async getVerifiedCourts(req: Request, res: Response): Promise<void> {
    try {
      // Use utility function to fetch verified courts without creator information (public endpoint)
      const courts = await fetchCourtsByVerifiedStatus(true, false);

      // Return the courts array
      res.status(200).json({
        success: true,
        message: 'Verified courts retrieved successfully',
        data: courts,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error retrieving verified courts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve verified courts',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Retrieves a specific verified court by ID
   * public endpoint
   * @param req - Request with court ID in params
   * @param res - Express response object
   */
  public static async getVerifiedCourt(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Validate that ID parameter exists
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Court ID is required',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Query the database for the verified court
      const result = await CourtsController.db.query(
        'SELECT id, name, address_line, city, state, zip_code, is_indoor, lights, sport FROM courts WHERE id = $1 AND verified = true',
        [id]
      );

      // Check if verified court was found
      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Verified court not found',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Return the verified court data
      res.status(200).json({
        success: true,
        message: 'Verified court retrieved successfully',
        data: result.rows[0],
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error retrieving verified court:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve verified court',
        timestamp: new Date().toISOString()
      });
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
      res.status(400).json({
        success: false,
        error: 'Invalid update data',
        data: { validationErrors: validationResult.errors },
        timestamp: new Date().toISOString()
      });
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
        res.status(400).json({
          success: false,
          error: 'No valid fields to update',
          timestamp: new Date().toISOString()
        });
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
        res.status(404).json({
          success: false,
          error: 'Court not found',
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Return the updated court
      const responseData = {
        court: result.rows[0],
        warnings: warnings.length > 0 ? warnings : undefined
      };
      
      res.status(200).json({
        success: true,
        message: 'Court updated successfully',
        data: responseData,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Update court error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update court',
        timestamp: new Date().toISOString()
      });
    }
  }
}
  