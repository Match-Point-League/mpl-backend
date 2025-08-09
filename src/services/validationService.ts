import { SignUpRequest } from '../types/authTypes';
import { ZipCodeService } from './zipCodeService';

export interface ValidationErrors {
  email?: string;
  password?: string;
  fullName?: string;
  displayName?: string;
  sportsInterested?: string;
  skillLevel?: string;
  zipCode?: string;
  general?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationErrors;
  cityInfo?: {
    city: string;
    state: string;
    fullLocation: string;
  };
}

/**
 * Service for validating registration form data
 */
export class ValidationService {
  /**
   * Validates complete registration form data
   */
  public static async validateRegistrationData(formData: SignUpRequest): Promise<ValidationResult> {
    const errors: ValidationErrors = {};

    // Full name validation
    if (!formData.fullName?.trim()) {
      errors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      errors.fullName = 'Full name must be at least 2 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    // Display name validation
    if (!formData.displayName) {
      errors.displayName = 'Display name is required';
    }

    // Sports interested validation
    if (!formData.sportsInterested || formData.sportsInterested.length === 0) {
      errors.sportsInterested = 'Please select at least one sport';
    }

    // Skill level validation
    if (formData.skillLevel < 1.0 || formData.skillLevel > 5.5) {
      errors.skillLevel = 'Skill level must be between 1.0 and 5.5';
    }

    // ZIP code validation
    if (!formData.zipCode) {
      errors.zipCode = 'ZIP code is required';
    } else if (!ZipCodeService.validateZipCodeFormat(formData.zipCode)) {
      errors.zipCode = 'Please enter a valid ZIP code';
    }

    // If there are validation errors, return early
    if (Object.keys(errors).length > 0) {
      return {
        isValid: false,
        errors
      };
    }

    // If ZIP code is valid, try to get city information
    let cityInfo = null;
    if (formData.zipCode && ZipCodeService.validateZipCodeFormat(formData.zipCode)) {
      cityInfo = await ZipCodeService.getCityFromZipCode(formData.zipCode);
    }

    return {
      isValid: true,
      errors: {},
      cityInfo: cityInfo || undefined
    };
  }
} 