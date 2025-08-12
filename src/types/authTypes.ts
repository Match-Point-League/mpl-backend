/**
 * Authentication-related types for the backend
 */

// SignUpRequest and SignUpResponse moved to registrationTypes.ts

export interface SignInRequest {
  email: string;
  password: string;
}

/**
 * User data returned in authentication responses
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  displayName: string;
  token: string;
}

export interface SignInResponse {
  success: boolean;
  message?: string;
  error?: string;
  token?: string;
  user?: AuthUser;
}

export interface FirebaseUser {
  uid: string;
  email: string;
  displayName?: string;
  emailVerified: boolean;
}

// AuthError interface removed - using unified handleFirebaseError method instead 