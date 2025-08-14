import { auth } from '../config/firebase';
import { SignInRequest, SignInResponse, FirebaseUser, CreateUserInput, RegistrationFormData, RegistrationResponse } from '../types';
import database from '../config/database';
import { ValidationService } from './validationService';

export class AuthService {
  private static db = database.getPool();

  /**
   * Create a new user in Firebase and store profile data in PostgreSQL
   */
  static async signUp(signUpData: RegistrationFormData): Promise<RegistrationResponse> {
    let firebaseUser: any = null;
    const startTime = Date.now();
    const timeoutMs = 30000; // 30 second timeout for entire operation
    
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

      // 2. Create user in Firebase with timeout
      firebaseUser = await this.createFirebaseUserWithTimeout(signUpData, timeoutMs - (Date.now() - startTime));

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

      // 4. Store user profile in PostgreSQL with retry
      const fields = Object.keys(userData);
      const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');
      const values = Object.values(userData);
      
      try {
        const result = await this.retryDatabaseInsert(fields, placeholders, values);
        
        // 5. Verify data completeness after insert
        const completenessCheck = await this.verifyDataCompleteness(firebaseUser.uid, userData);
        
        if (!completenessCheck.isComplete) {
          console.warn('User created but with incomplete data:', {
            firebaseUid: firebaseUser.uid,
            email: signUpData.email,
            missingFields: completenessCheck.missingFields
          });
          
          // Still return success but flag incomplete data
          return {
            success: true,
            message: 'User created successfully',
            userId: firebaseUser.uid,
            warning: 'Some profile information may be incomplete'
          };
        }
        
        return {
          success: true,
          message: 'User created successfully',
          userId: firebaseUser.uid,
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
        error: this.handleFirebaseError(error),
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
   * Retry database insert with exponential backoff for transient errors
   */
  private static async retryDatabaseInsert(fields: string[], placeholders: string, values: any[]): Promise<any> {
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.db.query(
          `INSERT INTO users (${fields.join(', ')})
           VALUES (${placeholders})
           RETURNING id`,
          values
        );
        
        // Success! Return the result
        return result;
      } catch (error: any) {
        const isTransientError = this.isTransientError(error);
        
        if (attempt === maxRetries || !isTransientError) {
          // Last attempt or non-transient error - re-throw to be handled by caller
          throw error;
        }
        
        // Transient error and not the last attempt - wait and retry
        const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff: 1s, 2s, 4s
        console.log(`Database insert attempt ${attempt} failed with transient error. Retrying in ${delay}ms...`, {
          error: error.message,
          attempt,
          maxRetries
        });
        
        await this.sleep(delay);
      }
    }
  }

  /**
   * Check if a database error is transient (can be retried)
   */
  private static isTransientError(error: any): boolean {
    const errorCode = error.code;
    
    // Transient error codes that can be retried
    const transientErrorCodes = [
      '08000', // Connection exception
      '08003', // Connection does not exist
      '57014', // Query canceled
      '40P01', // Deadlock detected
      '55P03', // Lock not available
      '53300', // Insufficient resources
      '57P01', // Admin shutdown
      '57P02', // Crash shutdown
      '57P03', // Cannot connect now
    ];
    
    return transientErrorCodes.includes(errorCode);
  }

  /**
   * Sleep utility for implementing delays
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create Firebase user with timeout protection
   */
  private static async createFirebaseUserWithTimeout(signUpData: RegistrationFormData, timeoutMs: number): Promise<any> {
    const firebasePromise = auth!.createUser({
      email: signUpData.email,
      password: signUpData.password,
      displayName: signUpData.displayName,
    });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Firebase operation timed out')), timeoutMs);
    });

    return Promise.race([firebasePromise, timeoutPromise]);
  }

  /**
   * Verify that all user data was stored correctly
   */
  private static async verifyDataCompleteness(firebaseUid: string, userData: CreateUserInput): Promise<{isComplete: boolean, missingFields: string[]}> {
    try {
      const result = await this.db.query(
        'SELECT email, name, display_name, skill_level, preferred_sport, city, zip_code, role FROM users WHERE email = $1',
        [userData.email]
      );

      if (result.rows.length === 0) {
        return { isComplete: false, missingFields: ['all'] };
      }

      const storedData = result.rows[0];
      const missingFields: string[] = [];

      // Define the fields to check
      const fields: (keyof CreateUserInput)[] = ['email', 'name', 'display_name', 'skill_level', 'preferred_sport', 'city', 'zip_code'];

      // Check each field for completeness
      for (const field of fields) {
        if (!storedData[field] || storedData[field] !== userData[field]) {
          missingFields.push(field);
        }
      }

      return {
        isComplete: missingFields.length === 0,
        missingFields
      };
    } catch (error) {
      console.error('Error verifying data completeness:', error);
      return { isComplete: false, missingFields: ['verification_failed'] };
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

      // 1. Get user by email using Firebase Admin SDK
      let firebaseUser;
      try {
        firebaseUser = await auth.getUserByEmail(signInData.email);
      } catch (error) {
        return {
          success: false,
          error: 'No account found with this email address',
        };
      }

      // 2. Verify password using Firebase Auth REST API (Admin SDK doesn't support password verification)
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

      if (!authResponse.ok) {
        const authData = await authResponse.json() as any;
        console.log('❌ Firebase Auth REST API error:', authData);
        
        // Provide specific error messages based on Firebase error codes
        switch (authData.error?.message) {
          case 'INVALID_PASSWORD':
            return {
              success: false,
              error: 'Incorrect password. Please try again.',
            };
          case 'USER_NOT_FOUND':
            return {
              success: false,
              error: 'No account found with this email address',
            };
          case 'INVALID_EMAIL':
            return {
              success: false,
              error: 'Please enter a valid email address',
            };
          case 'TOO_MANY_ATTEMPTS_TRY_LATER':
            return {
              success: false,
              error: 'Too many failed attempts. Please try again later.',
            };
          default:
            // Fallback to generic error message
            const errorMessage = this.handleFirebaseError(authData.error);
            return {
              success: false,
              error: errorMessage,
            };
        }
      }
      
      console.log('✅ Password verified successfully');

      // 2. Get user profile from PostgreSQL using email
      const result = await this.db.query(
        'SELECT id, email, name, display_name, role FROM users WHERE email = $1',
        [signInData.email]
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'User profile not found',
        };
      }

      const userProfile = result.rows[0];

      // 3. Create custom token for the user using Firebase Admin SDK
      const customToken = await auth.createCustomToken(firebaseUser.uid);

      return {
        success: true,
        message: 'Sign in successful',
        token: customToken,
        user: {
          id: firebaseUser.uid,  // Return Firebase UID from Admin SDK
          email: userProfile.email,
          name: userProfile.name,
          displayName: userProfile.display_name,
          token: customToken,
        },
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: this.handleFirebaseError(error),
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
   * Unified Firebase error handler for both Admin SDK and REST API errors
   */
  private static handleFirebaseError(error: any): string {
    // Handle Admin SDK errors
    if (error.code && typeof error.code === 'string' && error.code.startsWith('auth/')) {
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
        case 'auth/user-disabled':
          return 'This account has been disabled';
        case 'auth/too-many-requests':
          return 'Too many failed attempts. Please try again later';
        default:
          return error.message || 'Authentication failed';
      }
    }

    // Handle REST API errors
    if (error.message) {
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
        case 'INVALID_LOGIN_CREDENTIALS':
          return 'Invalid email or password';  
        default:
          return error.message || 'Authentication failed';
      }
    }

    return 'Authentication failed';
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