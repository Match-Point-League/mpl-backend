import { Request, Response } from 'express';
import { ApiResponse, RegistrationFormData, RegistrationResponse, SignInRequest, SignInResponse, AuthUser } from '../types';
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
        const response: ApiResponse<RegistrationResponse> = {
          success: true,
          message: result.message || 'Account created successfully',
          data: result,
          timestamp: new Date().toISOString(),
        };
        res.status(201).json(response);
      } else {
        // Handle validation errors or other errors
        const statusCode = result.validationErrors ? 400 : 500;
        const response: ApiResponse<RegistrationResponse> = {
          success: false,
          error: result.error || 'Failed to sign up user',
          data: result,
          timestamp: new Date().toISOString(),
        };
        res.status(statusCode).json(response);
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      
      const response: ApiResponse = {
        success: false,
        error: 'Failed to sign up user',
        timestamp: new Date().toISOString(),
      };
      
      res.status(500).json(response);
    }
  }

  /**
   * Handles user sign-in
   * POST /api/v1/auth/signin
   * 
   * This endpoint:
   * 1. Accepts email and password
   * 2. Authenticates with Firebase
   * 3. Retrieves user profile from PostgreSQL
   * 4. Returns authentication token and user data
   */
  public static async signIn(req: Request, res: Response): Promise<void> {
    try {
      const signInData: SignInRequest = req.body;

      // Use AuthService to handle sign-in
      const result = await AuthService.signIn(signInData);

      if (result.success) {
        const response: ApiResponse<AuthUser> = {
          success: true,
          message: result.message || 'Sign in successful',
          data: result.user,
          timestamp: new Date().toISOString(),
        };
        res.status(200).json(response);
      } else {
        const response: ApiResponse<AuthUser> = {
          success: false,
          error: result.error || 'Failed to sign in user',
          data: result.user,
          timestamp: new Date().toISOString(),
        };
        res.status(401).json(response);
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      
      const response: ApiResponse = {
        success: false,
        error: 'Failed to sign in user',
        timestamp: new Date().toISOString(),
      };
      
      res.status(500).json(response);
    }
  }
} 