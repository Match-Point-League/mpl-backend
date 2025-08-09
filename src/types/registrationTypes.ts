import { ValidationErrors } from './validationTypes';

/**
 * Registration form data structure for user sign-up
 */
export interface RegistrationFormData {
  fullName: string;
  email: string;
  confirmEmail: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  preferredSports: string[];
  skillLevel: number;
  zipCode: string;
}

/**
 * Registration API response
 */
export interface RegistrationResponse {
  success: boolean;
  message?: string;
  error?: string;
  validationErrors?: ValidationErrors;
}

// Re-export for backward compatibility
export type RegistrationErrors = ValidationErrors; 