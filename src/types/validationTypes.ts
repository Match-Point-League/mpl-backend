/**
 * Validation-related types for the backend
 */

/**
 * ZIP code lookup response from external API
 */
export interface ZipCodeResponse {
  places?: Array<{
    'place name': string;
    'state abbreviation': string;
  }>;
}

/**
 * City information extracted from ZIP code lookup
 */
export interface CityInfo {
  city: string;
  state: string;
  fullLocation: string;
}

/**
 * Validation errors for registration form
 */
export interface ValidationErrors {
  email?: string;
  password?: string;
  fullName?: string;
  displayName?: string;
  sportsInterested?: string;
  skillLevel?: string;
  zipCode?: string;
  general?: string;
  confirmEmail?: string;
  confirmPassword?: string;
}

/**
 * Validation result for registration data
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationErrors;
  cityInfo?: CityInfo;
} 