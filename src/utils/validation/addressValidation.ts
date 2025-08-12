/**
 * Address validation utilities for the Match Point League application
 */

import { US_STATES, VALIDATION_RULES } from './constants';
import { validateAddressFormat } from './stringValidation';

/**
 * Validates ZIP code format (5 digits or 5+4 format)
 * @param zipCode - The ZIP code to validate
 * @returns true if valid, false otherwise
 */
export function validateZipCodeFormat(zipCode: string): boolean {
  if (!zipCode || typeof zipCode !== 'string') {
    return false;
  }

  return VALIDATION_RULES.ZIP_CODE_REGEX.test(zipCode.trim());
}

/**
 * Validates if a state abbreviation is valid
 * @param state - The state abbreviation to validate
 * @returns true if valid, false otherwise
 */
export function validateState(state: string): boolean {
  if (!state || typeof state !== 'string') {
    return false;
  }

  const normalizedState = state.trim().toUpperCase();
  return US_STATES.includes(normalizedState as any);
}

/**
 * Validates city format (letters, spaces, hyphens, apostrophes)
 * @param city - The city name to validate
 * @returns true if valid, false otherwise
 */
export function validateCityFormat(city: string): boolean {
  if (!city || typeof city !== 'string') {
    return false;
  }

  const trimmed = city.trim();
  
  if (trimmed.length < 2) {
    return false;
  }

  return VALIDATION_RULES.CITY_REGEX.test(trimmed);
}

/**
 * Validates complete address components
 * @param addressLine - Street address
 * @param city - City name
 * @param state - State abbreviation
 * @param zipCode - ZIP code
 * @returns Object with validation results for each component
 */
export function validateAddressComponents(
  addressLine: string,
  city: string,
  state: string,
  zipCode: string
): {
  isValid: boolean;
  errors: {
    addressLine?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
} {
  const errors: any = {};

  if (!validateAddressFormat(addressLine)) {
    errors.addressLine = 'Invalid address format';
  }

  if (!validateCityFormat(city)) {
    errors.city = 'Invalid city format';
  }

  if (!validateState(state)) {
    errors.state = 'Invalid state abbreviation';
  }

  if (!validateZipCodeFormat(zipCode)) {
    errors.zipCode = 'Invalid ZIP code format';
  }

  const isValid = Object.keys(errors).length === 0;

  return {
    isValid,
    errors
  };
}
