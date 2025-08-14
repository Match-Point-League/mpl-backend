/**
 * Court validation service for the Match Point League application
 * 
 * This service handles all court-related validation logic by combining
 * utility functions with court-specific business rules.
 */

import { 
  validateStringLength, 
  validateAddressFormat, 
  validateCityFormat,
  validateZipCodeFormat,
  validateState,
  validateStateAgainstZipCode,
  VALIDATION_RULES
} from '../utils/validation';
import { CourtValidationInput, CourtValidationResult } from '../types/courtTypes';

/**
 * Service for validating court creation data
 */
export class CourtValidationService {

  /**
   * Validates the lights field based on indoor/outdoor status
   * @param isIndoor - Whether the court is indoor
   * @param lights - The lights value to validate
   * @returns Error message if validation fails, undefined if valid
   */
  private static validateLightsField(isIndoor: boolean, lights: boolean | undefined): string | undefined {
    if (isIndoor && lights !== undefined) {
      return 'Lights field is not applicable for indoor courts';
    }
    
    if (!isIndoor && (lights === undefined || lights === null)) {
      return 'Lights field is required for outdoor courts';
    }
    
    return undefined; // Validation passed
  }

  /**
   * Validates court creation input data
   * @param courtData - The court data to validate
   * @returns Validation result with errors and warnings
   */
  public static async validateCourtData(courtData: CourtValidationInput): Promise<CourtValidationResult> {
    const errors: any = {};
    const warnings: string[] = [];

    const nameError = validateStringLength(courtData.name, VALIDATION_RULES.MIN_NAME_LENGTH, VALIDATION_RULES.MAX_NAME_LENGTH) ? undefined : 'Name must be 2-255 characters';
    if (nameError) errors.name = nameError;

    const addressLineError = validateStringLength(courtData.address_line, VALIDATION_RULES.MIN_ADDRESS_LENGTH, VALIDATION_RULES.MAX_ADDRESS_LENGTH) ? undefined : 'Address must be 2-255 characters';
    if (addressLineError) errors.address_line = addressLineError;

    const cityError = validateStringLength(courtData.city, 2, 100) ? undefined : 'City must be 2-100 characters';
    if (cityError) errors.city = cityError;

    const stateError = validateStringLength(courtData.state, 2, 2) ? undefined : 'State must be 2 characters';
    if (stateError) errors.state = stateError;

    const zipCodeError = validateStringLength(courtData.zip_code, 5, 10) ? undefined : 'ZIP code must be 5-10 characters';
    if (zipCodeError) errors.zip_code = zipCodeError;

    // Format validations
    const addressFormatError = validateAddressFormat(courtData.address_line) ? undefined : 'Invalid address format';
    if (addressFormatError) errors.address_line = addressFormatError;

    const cityFormatError = validateCityFormat(courtData.city) ? undefined : 'Invalid city format';
    if (cityFormatError) errors.city = cityFormatError;

    const stateFormatError = validateState(courtData.state) ? undefined : 'Invalid state format';
    if (stateFormatError) errors.state = stateFormatError;

    const zipCodeFormatError = validateZipCodeFormat(courtData.zip_code) ? undefined : 'Invalid ZIP code format';
    if (zipCodeFormatError) errors.zip_code = zipCodeFormatError;

    // Other validations
    if (courtData.is_indoor === undefined) {
      errors.is_indoor = 'Indoor/outdoor status required';
    }

    if (!courtData.sport?.trim().length) {
      errors.sport = 'Sport is required';
    }

    const lightsError = this.validateLightsField(courtData.is_indoor, courtData.lights);
    if (lightsError) errors.lights = lightsError;

    // Advanced validations (asynchronous) - only if basic validations pass
    if (Object.keys(errors).length === 0) {
      // Validate state against ZIP code using external API
      const stateMatchesZipCode = await validateStateAgainstZipCode(courtData.state, courtData.zip_code);
      if (!stateMatchesZipCode) {
        errors.state = 'State does not match ZIP code';
      }
    }

    return { isValid: Object.keys(errors).length === 0, errors, warnings };
  }
}
