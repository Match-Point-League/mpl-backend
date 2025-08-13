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
  validateLightsField,
  VALIDATION_RULES
} from '../utils/validation';
import { CourtValidationInput, CourtValidationResult } from '../types/courtTypes';

/**
 * Service for validating court creation data
 */
export class CourtValidationService {

  /**
   * Validates court creation input data
   * @param courtData - The court data to validate
   * @returns Validation result with errors and warnings
   */
  public static async validateCourtData(courtData: CourtValidationInput): Promise<CourtValidationResult> {
    const errors: any = {};
    const warnings: string[] = [];

    // Basic validations (synchronous)
    const basicValidations = [
      { field: 'name', test: validateStringLength(courtData.name, VALIDATION_RULES.MIN_NAME_LENGTH, VALIDATION_RULES.MAX_NAME_LENGTH), error: 'Name must be 2-255 characters' },
      { field: 'address_line', test: validateStringLength(courtData.address_line, VALIDATION_RULES.MIN_ADDRESS_LENGTH, VALIDATION_RULES.MAX_ADDRESS_LENGTH), error: 'Address must be 2-255 characters' },
      { field: 'city', test: validateStringLength(courtData.city, 2, 100), error: 'City must be 2-100 characters' },
      { field: 'state', test: validateStringLength(courtData.state, 2, 2), error: 'State must be 2 characters' },
      { field: 'zip_code', test: validateStringLength(courtData.zip_code, 5, 10), error: 'ZIP code must be 5-10 characters' },
      
      // Format validations
      { field: 'address_line', test: validateAddressFormat(courtData.address_line), error: 'Invalid address format' },
      { field: 'city', test: validateCityFormat(courtData.city), error: 'Invalid city format' },
      { field: 'state', test: validateState(courtData.state), error: 'Invalid state format' },
      { field: 'zip_code', test: validateZipCodeFormat(courtData.zip_code), error: 'Invalid ZIP code format' },
      
      // Other validations
      { field: 'is_indoor', test: courtData.is_indoor !== undefined, error: 'Indoor/outdoor status required' },
      { field: 'sport', test: courtData.sport?.trim().length > 0, error: 'Sport is required' },
      { field: 'lights', test: validateLightsField(courtData.is_indoor, courtData.lights), error: 'Invalid lights field' }
    ];

    // Run basic validations
    basicValidations.forEach(({ field, test, error }) => {
      if (!test) errors[field] = error;
    });

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
