import { Request, Response } from 'express';
import { ApiResponse, RegistrationFormData, RegistrationResponse } from '../types';
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
      const formData: RegistrationFormData = req.body;

      // Use AuthService to handle registration (includes validation)
      const result = await AuthService.signUp(formData);

      if (result.success) {
        res.status(201).json(result);
      } else {
        // Handle validation errors or other errors
        const statusCode = result.validationErrors ? 400 : 500;
        res.status(statusCode).json(result);
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      
      const response = {
        success: false,
        error: 'Failed to sign up user',
        timestamp: new Date().toISOString(),
      };
      
      res.status(500).json(response);
    }
  }
} 