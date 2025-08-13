/**
 * Validation constants for the Match Point League application
 */

/**
 * Validation rules
 */
export const VALIDATION_RULES = {
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 255,
  MIN_ADDRESS_LENGTH: 2,
  MAX_ADDRESS_LENGTH: 255,
  ZIP_CODE_REGEX: /^\d{5}(-\d{4})?$/,
  CITY_REGEX: /^[A-Za-z\s\-']+$/,
} as const;
