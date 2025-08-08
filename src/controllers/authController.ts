import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { ValidationService } from '../services/validationService';
import { SignUpRequest, SignInRequest } from '../types/auth';
import { ApiResponse } from '../types';

export class AuthController {
  /**
   * Handle user sign-up
   */
  static async signUp(req: Request, res: Response): Promise<void> {
    try {
      const signUpData: SignUpRequest = req.body;

      // Validate required fields
      const requiredFields = ['email', 'password', 'fullName', 'displayName', 'sportsInterested', 'skillLevel', 'zipCode'];
      const missingFields = requiredFields.filter(field => !signUpData[field as keyof SignUpRequest]);

      if (missingFields.length > 0) {
        const response: ApiResponse = {
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}`,
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      // Validate registration data
      const validationResult = await ValidationService.validateRegistrationData(signUpData);
      
      if (!validationResult.isValid) {
        const response: ApiResponse = {
          success: false,
          error: 'Validation failed',
          data: validationResult.errors,
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      // Add city info if available
      if (validationResult.cityInfo) {
        signUpData.cityName = validationResult.cityInfo.city;
      }

      // Call auth service
      const result = await AuthService.signUp(signUpData);

      if (result.success) {
        const response: ApiResponse = {
          success: true,
          data: { userId: result.userId },
          message: result.message,
          timestamp: new Date().toISOString(),
        };
        res.status(201).json(response);
      } else {
        const response: ApiResponse = {
          success: false,
          error: result.error,
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
      }
    } catch (error) {
      console.error('Sign up controller error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      };
      res.status(500).json(response);
    }
  }

  /**
   * Handle user sign-in
   */
  static async signIn(req: Request, res: Response): Promise<void> {
    try {
      const signInData: SignInRequest = req.body;

      // Validate required fields
      if (!signInData.email || !signInData.password) {
        const response: ApiResponse = {
          success: false,
          error: 'Email and password are required',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      // Call auth service
      const result = await AuthService.signIn(signInData);

      if (result.success) {
        const response: ApiResponse = {
          success: true,
          data: {
            token: result.token,
            user: result.user,
          },
          message: result.message,
          timestamp: new Date().toISOString(),
        };
        res.json(response);
      } else {
        const response: ApiResponse = {
          success: false,
          error: result.error,
          timestamp: new Date().toISOString(),
        };
        res.status(401).json(response);
      }
    } catch (error) {
      console.error('Sign in controller error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      };
      res.status(500).json(response);
    }
  }

  /**
   * Verify authentication token
   */
  static async verifyToken(req: Request, res: Response): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        const response: ApiResponse = {
          success: false,
          error: 'Authorization header required',
          timestamp: new Date().toISOString(),
        };
        res.status(401).json(response);
        return;
      }

      const token = authHeader.split(' ')[1];
      const user = await AuthService.verifyToken(token);

      if (user) {
        const response: ApiResponse = {
          success: true,
          data: { user },
          timestamp: new Date().toISOString(),
        };
        res.json(response);
      } else {
        const response: ApiResponse = {
          success: false,
          error: 'Invalid token',
          timestamp: new Date().toISOString(),
        };
        res.status(401).json(response);
      }
    } catch (error) {
      console.error('Token verification controller error:', error);
      const response: ApiResponse = {
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      };
      res.status(500).json(response);
    }
  }

  /**
   * Validate registration data
   */
  static async validateRegistration(req: Request, res: Response): Promise<void> {
    try {
      const formData: SignUpRequest = req.body;

      // Validate the registration data
      const validationResult = await ValidationService.validateRegistrationData(formData);

      const response: ApiResponse = {
        success: validationResult.isValid,
        data: {
          isValid: validationResult.isValid,
          errors: validationResult.errors,
          cityInfo: validationResult.cityInfo
        },
        timestamp: new Date().toISOString(),
      };

      res.status(validationResult.isValid ? 200 : 400).json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: 'Failed to validate registration data',
        timestamp: new Date().toISOString(),
      };
      res.status(500).json(response);
    }
  }

  /**
   * Validate ZIP code
   */
  static async validateZipCode(req: Request, res: Response): Promise<void> {
    try {
      const { zipCode } = req.body;

      if (!zipCode) {
        const response: ApiResponse = {
          success: false,
          error: 'ZIP code is required',
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      const cityInfo = await ValidationService.validateRegistrationData({ 
        email: '', 
        password: '', 
        fullName: '', 
        displayName: '', 
        sportsInterested: [], 
        skillLevel: 1.0, 
        zipCode 
      } as SignUpRequest);

      const response: ApiResponse = {
        success: true,
        data: {
          isValid: !cityInfo.errors.zipCode,
          cityInfo: cityInfo.cityInfo
        },
        timestamp: new Date().toISOString(),
      };

      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: 'Failed to validate ZIP code',
        timestamp: new Date().toISOString(),
      };
      res.status(500).json(response);
    }
  }
} 