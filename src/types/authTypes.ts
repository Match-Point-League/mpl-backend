/**
 * Authentication-related types for the backend
 */

// SignUpRequest and SignUpResponse moved to registrationTypes.ts

export interface SignInRequest {
  email: string;
  password: string;
}

export interface SignInResponse {
  success: boolean;
  message?: string;
  error?: string;
  token?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    displayName: string;
    role: string;
  };
}

export interface FirebaseUser {
  uid: string;
  email: string;
  displayName?: string;
  emailVerified: boolean;
}

export interface AuthError {
  code: string;
  message: string;
} 