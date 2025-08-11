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
      const firebaseUser = await auth.createUser({
        email: signUpData.email,
        password: signUpData.password,
        displayName: signUpData.displayName,
      });

      // 2. Prepare user data for PostgreSQL
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

      // 3. Store user profile in PostgreSQL
      const fields = Object.keys(userData);
      const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');
      const values = Object.values(userData);
      
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
    } catch (error) {
      console.error('Sign up error:', error);
      return {
        success: false,
        error: this.handleFirebaseError(error),
      };
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
} 