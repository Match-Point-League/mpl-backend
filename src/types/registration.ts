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
  sportsInterested: string[];
  skillLevel: number;
  zipCode: string;
}

/**
 * Validation errors for registration form
 */
export interface RegistrationErrors {
  fullName?: string;
  email?: string;
  confirmEmail?: string;
  password?: string;
  confirmPassword?: string;
  displayName?: string;
  sportsInterested?: string;
  skillLevel?: string;
  zipCode?: string;
  general?: string;
}

/**
 * ZIP code lookup response
 */
export interface ZipCodeResponse {
  city: string;
  state: string;
  fullLocation: string;
}

/**
 * Registration validation result
 */
export interface RegistrationValidationResult {
  isValid: boolean;
  errors: RegistrationErrors;
  cityInfo?: ZipCodeResponse;
}

/**
 * Registration API response
 */
export interface RegistrationResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    user: {
      uid: string;
      email: string;
      displayName: string;
      cityInfo?: ZipCodeResponse;
    };
  };
} 