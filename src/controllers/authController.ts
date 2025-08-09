import { Request, Response } from 'express';
import { ApiResponse, SignUpRequest, SignUpResponse } from '../types';
import { AuthService } from '../services/authService';

export class AuthController {
  /**
   * Handles user registration (sign-up)
   * POST /api/v1/auth/signup
   * 
   * This endpoint:
   * 1. Accepts registration form data
   * 2. Validates data using ValidationService
   * 3. Creates user using AuthService
   * 4. Returns success/error response with field-specific errors
   */
  public static async signUp(req: Request, res: Response): Promise<void> {
    try {
      const formData: SignUpRequest = req.body;

      // Use AuthService to handle registration (includes validation)
      const result = await AuthService.signUp(formData);

      if (result.success) {
        const response: ApiResponse<SignUpResponse> = {
          success: true,
          message: result.message || 'Account created successfully',
          data: result,
          timestamp: new Date().toISOString(),
        };
        res.status(201).json(response);
      } else {
        // Handle validation errors or other errors
        const statusCode = result.validationErrors ? 400 : 500;
        const response: ApiResponse<SignUpResponse> = {
          success: false,
          error: result.error || 'Registration failed',
          data: result,
          timestamp: new Date().toISOString(),
        };
        res.status(statusCode).json(response);
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      
      const response: ApiResponse = {
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      };
      
      res.status(500).json(response);
    }
  }
} 