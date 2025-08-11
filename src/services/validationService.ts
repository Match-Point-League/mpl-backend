import { SportOptions, UserRole, ZipCodeResponse, CityInfo, ValidationErrors, ValidationResult, RegistrationFormData } from '../types';

/**
 * Service for validating registration form data
 */
export class ValidationService {
  /**
   * Validates ZIP code format
   */
  private static validateZipCodeFormat(zipCode: string): boolean {
    const zipRegex = /^\d{5}(-\d{4})?$/;
    return zipRegex.test(zipCode);
  }

  /**
   * Fetches city and state information from a ZIP code
   */
  private static async getCityFromZipCode(zipCode: string): Promise<CityInfo | null> {
    if (!zipCode || zipCode.length !== 5) {
      return null;
    }

    try {
      const response = await fetch(`https://api.zippopotam.us/US/${zipCode}`);
      
      if (!response.ok) {
        return null;
      }

      const data = await response.json() as ZipCodeResponse;
      
      if (!data.places || data.places.length === 0) {
        return null;
      }

      const place = data.places[0];
      const city = place['place name'];
      const state = place['state abbreviation'];

      return {
        city,
        state,
        fullLocation: `${city}, ${state}`
      };
    } catch (error) {
      console.error('Error fetching ZIP code data:', error);
      return null;
    }
  }

  /**
   * Validates complete registration form data
   */
  public static async validateRegistrationData(formData: RegistrationFormData): Promise<ValidationResult> {
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

    // Confirm email validation
    if (!formData.confirmEmail) {
      errors.confirmEmail = 'Please confirm your email';
    } else if (formData.email !== formData.confirmEmail) {
      errors.confirmEmail = 'Email addresses do not match';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Display name validation
    if (!formData.displayName) {
      errors.displayName = 'Display name is required';
    }

    // Sports interested validation
    if (!formData.preferredSports || formData.preferredSports.length === 0) {
      errors.preferredSports = 'Please select at least one sport';
    } else {
      // Validate that only valid sports are selected
      const validSports = [SportOptions.TENNIS, SportOptions.PICKLEBALL];
      const invalidSports = formData.preferredSports.filter(sport => !validSports.includes(sport.toLowerCase() as SportOptions));
      if (invalidSports.length > 0) {
        errors.preferredSports = `Invalid sports selected: ${invalidSports.join(', ')}. Only tennis and pickleball are allowed.`;
      }
    }

    // Skill level validation
    if (formData.skillLevel < 1.0 || formData.skillLevel > 5.5) {
      errors.skillLevel = 'Skill level must be between 1.0 and 5.5';
    } else if (formData.skillLevel % 0.5 !== 0) {
      errors.skillLevel = 'Skill level must be in increments of 0.5 (e.g., 1.0, 1.5, 2.0, etc.)';
    }

    // ZIP code validation
    if (!formData.zipCode) {
      errors.zipCode = 'ZIP code is required';
    } else if (!this.validateZipCodeFormat(formData.zipCode)) {
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
    let cityInfo: CityInfo | null = null;
    if (formData.zipCode && this.validateZipCodeFormat(formData.zipCode)) {
      cityInfo = await this.getCityFromZipCode(formData.zipCode);
    }

    return {
      isValid: true,
      errors: {},
      cityInfo: cityInfo || undefined
    };
  }

  /**
   * Map sports array to preferred sport enum
   */
  public static mapSportsToPreferredSport(sports: string[]): SportOptions {
    if (sports.includes('tennis') && sports.includes('pickleball')) {
      return SportOptions.BOTH;
    } else if (sports.includes('pickleball')) {
      return SportOptions.PICKLEBALL;
    } else {
      return SportOptions.TENNIS;
    }
  }

  /**
   * Get default role for new users
   */
  public static getDefaultRole(): UserRole {
    return UserRole.PLAYER;
  }
} 