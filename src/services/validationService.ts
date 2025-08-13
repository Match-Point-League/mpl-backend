import { SportOptions, ZipCodeResponse, CityInfo, ValidationErrors, ValidationResult, RegistrationFormData, UpdateUserInput } from '../types';

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
   * Validates full name field
   */
  private static validateFullName(fullName: string | undefined): string | null {
    if (!fullName?.trim()) {
      return 'Full name is required';
    }
    if (fullName.trim().length < 2) {
      return 'Full name must be at least 2 characters';
    }
    return null;
  }

  /**
   * Validates email field
   */
  private static validateEmail(email: string | undefined): string | null {
    if (!email) {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return null;
  }

  /**
   * Validates confirm email field
   */
  private static validateConfirmEmail(confirmEmail: string | undefined, email: string | undefined): string | null {
    if (!confirmEmail) {
      return 'Please confirm your email';
    }
    if (email !== confirmEmail) {
      return 'Email addresses do not match';
    }
    return null;
  }

  /**
   * Validates password field
   */
  private static validatePassword(password: string | undefined): string | null {
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }
    return null;
  }

  /**
   * Validates confirm password field
   */
  private static validateConfirmPassword(confirmPassword: string | undefined, password: string | undefined): string | null {
    if (!confirmPassword) {
      return 'Please confirm your password';
    }
    if (password !== confirmPassword) {
      return 'Passwords do not match';
    }
    return null;
  }

  /**
   * Validates display name field
   */
  private static validateDisplayName(displayName: string | undefined): string | null {
    if (!displayName) {
      return 'Display name is required';
    }
    return null;
  }

  /**
   * Validates preferred sports field
   */
  private static validatePreferredSports(preferredSports: string[] | undefined): string | null {
    if (!preferredSports || preferredSports.length === 0) {
      return 'Please select at least one sport';
    }
    
    // Ensure only valid sports are selected
    const validSports = Object.values(SportOptions).map(sport => sport.toLowerCase());
    const invalidSports = preferredSports.filter(sport => !validSports.includes(sport.toLowerCase()));
    if (invalidSports.length > 0) {
      return `Invalid sports selected: ${invalidSports.join(', ')}. Only tennis and pickleball are allowed.`;
    }
    return null;
  }

  /**
   * Validates skill level field
   */
  private static validateSkillLevel(skillLevel: number | undefined): string | null {
    if (skillLevel === undefined) {
      return 'Skill level is required';
    }
    if (skillLevel < 1.0 || skillLevel > 5.5) {
      return 'Skill level must be between 1.0 and 5.5';
    }
    if (skillLevel % 0.5 !== 0) {
      return 'Skill level must be in increments of 0.5 (e.g., 1.0, 1.5, 2.0, etc.)';
    }
    return null;
  }

  /**
   * Validates ZIP code field
   */
  private static validateZipCode(zipCode: string | undefined): string | null {
    if (!zipCode) {
      return 'ZIP code is required';
    }
    if (!this.validateZipCodeFormat(zipCode)) {
      return 'Please enter a valid ZIP code';
    }
    return null;
  }

  /**
   * Validates complete registration form data
   */
  public static async validateRegistrationData(formData: RegistrationFormData): Promise<ValidationResult> {
    const errors: ValidationErrors = {};

    // Validate each field using individual validation functions
    const fullNameError = this.validateFullName(formData.fullName);
    if (fullNameError) errors.fullName = fullNameError;

    const emailError = this.validateEmail(formData.email);
    if (emailError) errors.email = emailError;

    const confirmEmailError = this.validateConfirmEmail(formData.confirmEmail, formData.email);
    if (confirmEmailError) errors.confirmEmail = confirmEmailError;

    const passwordError = this.validatePassword(formData.password);
    if (passwordError) errors.password = passwordError;

    const confirmPasswordError = this.validateConfirmPassword(formData.confirmPassword, formData.password);
    if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;

    const displayNameError = this.validateDisplayName(formData.displayName);
    if (displayNameError) errors.displayName = displayNameError;

    const preferredSportsError = this.validatePreferredSports(formData.preferredSports);
    if (preferredSportsError) errors.preferredSports = preferredSportsError;

    const skillLevelError = this.validateSkillLevel(formData.skillLevel);
    if (skillLevelError) errors.skillLevel = skillLevelError;

    const zipCodeError = this.validateZipCode(formData.zipCode);
    let cityInfo: CityInfo | null = null;
    if (zipCodeError) {
      errors.zipCode = zipCodeError;
    } else {
      cityInfo = await this.getCityFromZipCode(formData.zipCode);
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      cityInfo: cityInfo || undefined
    };
  }

  /**
   * Validates update user data
   */
  public static async validateUpdateUserData(formData: UpdateUserInput): Promise<ValidationResult> {
    const errors: ValidationErrors = {};
    let cityInfo: CityInfo | null = null;

    if (formData.name) {
      const fullNameError = this.validateFullName(formData.name);
      if (fullNameError) errors.fullName = fullNameError;
    }

    if (formData.display_name) {
      const displayNameError = this.validateDisplayName(formData.display_name);
      if (displayNameError) errors.displayName = displayNameError;
    }

    if (formData.skill_level) {
      const skillLevelError = this.validateSkillLevel(formData.skill_level);
      if (skillLevelError) errors.skillLevel = skillLevelError;
    }

    if (formData.preferred_sport) {
      const preferredSportsError = this.validatePreferredSports([formData.preferred_sport as string]);
      if (preferredSportsError) errors.preferredSports = preferredSportsError;
    }

    if (formData.zip_code) {
      const zipCodeError = this.validateZipCode(formData.zip_code);
      if (zipCodeError) errors.zipCode = zipCodeError;

      if (!zipCodeError) {
        cityInfo = await this.getCityFromZipCode(formData.zip_code);
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      cityInfo: cityInfo || undefined
    }

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
} 