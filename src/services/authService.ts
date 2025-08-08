import { auth } from '../config/firebase';
import { SignUpRequest, SignUpResponse, SignInRequest, SignInResponse, FirebaseUser, AuthError } from '../types/auth';
import { CreateUserInput, PreferredSport } from '../types/userTypes';
import database from '../config/database';

export class AuthService {
  private static db = database.getPool();

  /**
   * Create a new user in Firebase and store profile data in PostgreSQL
   */
  static async signUp(signUpData: SignUpRequest): Promise<SignUpResponse> {
    try {
      // 1. Create user in Firebase
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
        preferred_sport: this.mapSportsToPreferredSport(signUpData.sportsInterested),
        is_competitive: false, // Default value
        city: signUpData.cityName || '',
        zip_code: signUpData.zipCode,
        allow_direct_contact: false, // Default value
      };

      // 3. Store user profile in PostgreSQL
      const result = await this.db.query(
        `INSERT INTO users (email, name, display_name, skill_level, preferred_sport, is_competitive, city, zip_code, allow_direct_contact)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [
          userData.email,
          userData.name,
          userData.display_name,
          userData.skill_level,
          userData.preferred_sport,
          userData.is_competitive,
          userData.city,
          userData.zip_code,
          userData.allow_direct_contact,
        ]
      );

      return {
        success: true,
        message: 'User created successfully',
        userId: result.rows[0].id,
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return {
        success: false,
        error: this.handleAuthError(error as AuthError),
      };
    }
  }

  /**
   * Sign in user with email and password
   */
  static async signIn(signInData: SignInRequest): Promise<SignInResponse> {
    try {
      // 1. Verify user exists in Firebase
      const firebaseUser = await auth.getUserByEmail(signInData.email);

      // 2. Get user profile from PostgreSQL
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

      // 3. Create custom token for the user
      const customToken = await auth.createCustomToken(firebaseUser.uid);

      return {
        success: true,
        message: 'Sign in successful',
        token: customToken,
        user: {
          id: userProfile.id,
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
   * Map sports array to preferred sport enum
   */
  private static mapSportsToPreferredSport(sports: string[]): PreferredSport {
    if (sports.includes('tennis') && sports.includes('pickleball')) {
      return PreferredSport.BOTH;
    } else if (sports.includes('pickleball')) {
      return PreferredSport.PICKLEBALL;
    } else {
      return PreferredSport.TENNIS;
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
} 