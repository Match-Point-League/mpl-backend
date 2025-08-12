/**
 * Validation constants for the Match Point League application
 */

/**
 * Valid US state abbreviations
 */
export const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
] as const;

/**
 * US state type for type safety
 */
export type USState = typeof US_STATES[number];

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
