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
 * Registration API response
 */
export interface RegistrationResponse {
  success: boolean;
  message?: string;
  error?: string;
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