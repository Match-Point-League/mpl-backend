import { auth } from '../config/firebase';
import { SignInRequest, SignInResponse, FirebaseUser, AuthError, CreateUserInput, RegistrationFormData, RegistrationResponse } from '../types';
import database from '../config/database';
import { ValidationService } from './validationService';

export class AuthService {
  private static db = database.getPool();

  /**
   * Create a new user in Firebase and store profile data in PostgreSQL
   */
  static async signUp(signUpData: RegistrationFormData): Promise<RegistrationResponse> {
    let firebaseUser: any = null;
    
    try {
      if (!auth) {
        throw new Error('Firebase authentication not configured');
      }

      // 1. Validate registration data
      const validationResult = await ValidationService.validateRegistrationData(signUpData);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: 'Validation failed',
          validationErrors: validationResult.errors
        };
      }

      // 2. Create user in Firebase
      firebaseUser = await auth.createUser({
        email: signUpData.email,
        password: signUpData.password,
        displayName: signUpData.displayName,
      });

      // 3. Prepare user data for PostgreSQL
      const userData: CreateUserInput = {
        email: signUpData.email,
        name: signUpData.fullName,
        display_name: signUpData.displayName,
        skill_level: signUpData.skillLevel,
        preferred_sport: ValidationService.mapSportsToPreferredSport(signUpData.preferredSports),
        is_competitive: false, // Default value
        city: validationResult.cityInfo?.fullLocation || '',
        zip_code: signUpData.zipCode,
        allow_direct_contact: false, // Default value
      };

      // 4. Store user profile in PostgreSQL
      const fields = Object.keys(userData);
      const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');
      const values = Object.values(userData);
      
      try {
        const result = await this.db.query(
          `INSERT INTO users (${fields.join(', ')})
           VALUES (${placeholders})
           RETURNING id`,
          values
        );

        return {
          success: true,
          message: 'User created successfully',
          userId: firebaseUser.uid,  // Return Firebase UID instead of PostgreSQL ID
        };
      } catch (dbError: any) {
        // Handle database-specific errors
        const dbErrorMessage = this.handleDatabaseError(dbError);
        
        // Log the database error for debugging
        console.error('Database error during user creation:', {
          error: dbError,
          email: signUpData.email,
          firebaseUid: firebaseUser.uid
        });

        // Rollback: Delete Firebase user since database insert failed
        await this.rollbackFirebaseUser(firebaseUser.uid, signUpData.email);

        return {
          success: false,
          error: dbErrorMessage,
        };
      }
    } catch (error) {
      // If Firebase user creation failed, no rollback needed
      if (firebaseUser) {
        // If we got here and have a Firebase user, something else failed
        // Rollback the Firebase user to be safe
        await this.rollbackFirebaseUser(firebaseUser.uid, signUpData.email);
      }
      
      console.error('Sign up error:', error);
      return {
        success: false,
        error: this.handleAuthError(error as AuthError),
      };
    }
  }

  /**
   * Rollback Firebase user creation by deleting the user
   */
  private static async rollbackFirebaseUser(firebaseUid: string, email: string): Promise<void> {
    try {
      if (!auth) {
        console.error('Cannot rollback Firebase user: auth not configured');
        return;
      }

      await auth.deleteUser(firebaseUid);
      console.log(`Firebase user rollback successful for UID: ${firebaseUid}, email: ${email}`);
    } catch (rollbackError: any) {
      console.error('Firebase rollback failed:', {
        firebaseUid,
        email,
        error: rollbackError
      });
      // Don't throw here - we don't want rollback failure to affect the main error response
    }
  }

  /**
   * Sign in user with email and password
   */
  static async signIn(signInData: SignInRequest): Promise<SignInResponse> {
    try {
      if (!auth) {
        throw new Error('Firebase authentication not configured');
      }

      // 1. Verify email and password with Firebase Auth REST API
      const firebaseApiKey = process.env.FIREBASE_API_KEY;
      if (!firebaseApiKey) {
        throw new Error('Firebase API key not configured');
      }

      const authResponse = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: signInData.email,
            password: signInData.password,
            returnSecureToken: true
          })
        }
      );

      const authData = await authResponse.json() as any;

      if (!authResponse.ok) {
        // Handle Firebase Auth errors
        const errorMessage = this.handleFirebaseAuthError(authData.error);
        return {
          success: false,
          error: errorMessage,
        };
      }

      // 2. Get user profile from PostgreSQL using email
      const result = await this.db.query(
        'SELECT id, email, name, display_name FROM users WHERE email = $1',
        [signInData.email]
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'User profile not found',
        };
      }

      const userProfile = result.rows[0];

      // 3. Create custom token for the user (using the verified UID)
      const customToken = await auth.createCustomToken(authData.localId as string);

      return {
        success: true,
        message: 'Sign in successful',
        token: customToken,
        user: {
          id: authData.localId,  // Return Firebase UID from auth response
          email: userProfile.email,
          name: userProfile.name,
          displayName: userProfile.display_name,
        },
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: this.handleAuthError(error as AuthError),
      };
    }
  }

  /**
   * Verify Firebase ID token
   */
  static async verifyToken(idToken: string): Promise<FirebaseUser | null> {
    try {
      if (!auth) {
        throw new Error('Firebase authentication not configured');
      }

      const decodedToken = await auth.verifyIdToken(idToken);
      return {
        uid: decodedToken.uid,
        email: decodedToken.email || '',
        displayName: decodedToken.name || undefined,
        emailVerified: decodedToken.email_verified || false,
      };
    } catch (error) {
      console.error('Token verification error:', error);
      return null;
    }
  }

  /**
   * Handle Firebase authentication errors
   */
  private static handleAuthError(error: AuthError): string {
    switch (error.code) {
      case 'auth/email-already-exists':
        return 'An account with this email already exists';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/weak-password':
        return 'Password is too weak';
      case 'auth/user-not-found':
        return 'User not found';
      case 'auth/wrong-password':
        return 'Incorrect password';
      default:
        return error.message || 'Authentication failed';
    }
  }

  /**
   * Handle Firebase Auth REST API errors
   */
  private static handleFirebaseAuthError(error: any): string {
    if (!error || !error.message) {
      return 'Authentication failed';
    }

    switch (error.message) {
      case 'EMAIL_NOT_FOUND':
        return 'No account found with this email address';
      case 'INVALID_PASSWORD':
        return 'Incorrect password';
      case 'USER_DISABLED':
        return 'This account has been disabled';
      case 'TOO_MANY_ATTEMPTS_TRY_LATER':
        return 'Too many failed attempts. Please try again later';
      case 'INVALID_EMAIL':
        return 'Invalid email address';
      default:
        return error.message || 'Authentication failed';
    }
  }

  /**
   * Handle database-specific errors and return user-friendly messages
   */
  private static handleDatabaseError(error: any): string {
    // PostgreSQL error codes
    const errorCode = error.code;
    
    switch (errorCode) {
      case '23505': // Unique violation
        if (error.constraint && error.constraint.includes('email')) {
          return 'An account with this email already exists';
        }
        return 'A record with this information already exists';
        
      case '23502': // Not null violation
        return 'Required information is missing. Please check your registration data.';
        
      case '23514': // Check violation
        if (error.constraint && error.constraint.includes('skill_level')) {
          return 'Skill level must be between 1.0 and 5.5';
        }
        if (error.constraint && error.constraint.includes('preferred_sport')) {
          return 'Preferred sport must be tennis, pickleball, or both';
        }
        return 'Invalid data provided. Please check your registration information.';
        
      case '08000': // Connection exception
        return 'Database connection error. Please try again later.';
        
      case '08003': // Connection does not exist
        return 'Database connection lost. Please try again later.';
        
      case '57014': // Query canceled
        return 'Database operation was canceled. Please try again.';
        
      case '40P01': // Deadlock detected
        return 'Database is temporarily busy. Please try again in a moment.';
        
      default:
        // Log unknown error codes for debugging
        console.error('Unknown database error code:', errorCode, error);
        return 'Database error occurred. Please try again later.';
    }
  }
} 