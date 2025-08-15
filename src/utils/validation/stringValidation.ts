/**
 * String validation utilities for the Match Point League application
 */

import { VALIDATION_RULES } from './constants';

/**
 * Validates string length with optional min and max constraints
 * @param value - The string to validate
 * @param minLength - Minimum required length
 * @param maxLength - Maximum allowed length (optional)
 * @returns true if valid, false otherwise
 */
export function validateStringLength(
  value: string, 
  minLength: number, 
  maxLength?: number
): boolean {
  if (!value || typeof value !== 'string') {
    return false;
  }

  const trimmedLength = value.trim().length;
  
  if (trimmedLength < minLength) {
    return false;
  }

  if (maxLength && trimmedLength > maxLength) {
    return false;
  }

  return true;
}

/**
 * Validates name format (letters, spaces, hyphens, apostrophes)
 * @param value - The name to validate
 * @returns true if valid, false otherwise
 */
export function validateNameFormat(value: string): boolean {
  if (!value || typeof value !== 'string') {
    return false;
  }

  return VALIDATION_RULES.CITY_REGEX.test(value.trim());
}