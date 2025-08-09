/**
 * Authentication-related types for the backend
 */

export interface SignUpRequest {
  email: string;
  confirmEmail: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  displayName: string;
  sportsInterested: string[];
  skillLevel: number;
  zipCode: string;
}

export interface SignUpResponse {
  success: boolean;
  message?: string;
  error?: string;
  userId?: string;
  validationErrors?: {
    email?: string;
    password?: string;
    fullName?: string;
    displayName?: string;
    sportsInterested?: string;
    skillLevel?: string;
    zipCode?: string;
    confirmEmail?: string;
    confirmPassword?: string;
    general?: string;
  };
}

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