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
  VALIDATION_RULES
} from '../utils/validation';

/**
 * Court validation input interface
 */
export interface CourtValidationInput {
  name: string;
  address_line: string;
  city: string;
  state: string;
  zip_code: string;
  is_indoor: boolean;
  lights?: boolean;
  sport: string;
}

/**
 * Court validation result interface
 */
export interface CourtValidationResult {
  isValid: boolean;
  errors: {
    name?: string;
    address_line?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    is_indoor?: string;
    lights?: string;
    sport?: string;
  };
  warnings: string[];
}

/**
 * Service for validating court creation data
 */
export class CourtValidationService {

  /**
   * Validates court creation input data
   * @param courtData - The court data to validate
   * @returns Validation result with errors and warnings
   */
  public static validateCourtData(courtData: CourtValidationInput): CourtValidationResult {
    const errors: any = {};
    const warnings: string[] = [];

    // All validations in one array
    const allValidations = [
      // Basic validations
      { field: 'name', test: validateStringLength(courtData.name, VALIDATION_RULES.MIN_NAME_LENGTH, VALIDATION_RULES.MAX_NAME_LENGTH), error: 'Name must be 2-255 characters' },
      { field: 'address_line', test: validateStringLength(courtData.address_line, VALIDATION_RULES.MIN_ADDRESS_LENGTH, VALIDATION_RULES.MAX_ADDRESS_LENGTH), error: 'Address must be 2-255 characters' },
      { field: 'city', test: validateStringLength(courtData.city, 2, 100), error: 'City must be 2-100 characters' },
      { field: 'state', test: validateStringLength(courtData.state, 2, 2), error: 'State must be 2 characters' },
      { field: 'zip_code', test: validateStringLength(courtData.zip_code, 5, 10), error: 'ZIP code must be 5-10 characters' },
      
      // Format validations
      { field: 'address_line', test: validateAddressFormat(courtData.address_line), error: 'Invalid address format' },
      { field: 'city', test: validateCityFormat(courtData.city), error: 'Invalid city format' },
      { field: 'state', test: validateState(courtData.state), error: 'Invalid state' },
      { field: 'zip_code', test: validateZipCodeFormat(courtData.zip_code), error: 'Invalid ZIP code format' },
      
      // Other validations
      { field: 'is_indoor', test: courtData.is_indoor !== undefined, error: 'Indoor/outdoor status required' },
      { field: 'sport', test: courtData.sport?.trim().length > 0, error: 'Sport is required' },
      { field: 'lights', test: !(courtData.is_indoor && courtData.lights !== undefined), error: 'Lights not applicable for indoor courts' },
      { field: 'lights', test: !(!courtData.is_indoor && courtData.lights === undefined), error: 'Lights required for outdoor courts' }
    ];

    // Single loop - no if statements
    allValidations.forEach(({ field, test, error }) => {
      if (!test) errors[field] = error;
    });

    return { isValid: Object.keys(errors).length === 0, errors, warnings };
  }
}
