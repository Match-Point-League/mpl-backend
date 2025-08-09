import { Request, Response } from 'express';
import { ApiResponse, RegistrationFormData, RegistrationResponse } from '../types';
import { auth } from '../config/firebase';

export class AuthController {
  /**
   * Handles user registration (sign-up)
   * POST /api/v1/auth/signup
   * 
   * This endpoint:
   * 1. Accepts registration form data (frontend already validated)
   * 2. Creates a Firebase user
   * 3. Returns success/error response
   * 
   * Note: Does NOT save to PostgreSQL - that's a separate feature
   */
  public static async signUp(req: Request, res: Response): Promise<void> {
    try {
      const formData: RegistrationFormData = req.body;

      // Check if Firebase is configured
      if (!auth) {
        const response: ApiResponse = {
          success: false,
          error: 'Firebase is not configured',
          timestamp: new Date().toISOString(),
        };
        res.status(500).json(response);
        return;
      }

      // Create Firebase user (frontend already validated the data)
      let firebaseUser;
      try {
        firebaseUser = await auth.createUser({
          email: formData.email,
          password: formData.password,
          displayName: formData.displayName,
        });
      } catch (firebaseError: any) {
        let errorMessage = 'Failed to create user account';
        
        switch (firebaseError.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'The email address is already in use by another account.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Invalid email address';
            break;
          case 'auth/weak-password':
            errorMessage = 'Password should be at least 6 characters';
            break;
          default:
            errorMessage = firebaseError.message || errorMessage;
        }

        const response: ApiResponse = {
          success: false,
          error: errorMessage,
          timestamp: new Date().toISOString(),
        };
        res.status(400).json(response);
        return;
      }

      // Success response
      const response: ApiResponse<RegistrationResponse> = {
        success: true,
        message: 'Account created successfully',
        data: {
          success: true,
          message: 'Account created successfully',
          data: {
            user: {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || '',
            },
          },
        },
        timestamp: new Date().toISOString(),
      };

      res.status(201).json(response);
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