/**
 * Sport validation utilities for the Match Point League application
 */

import { SportOptions } from '../../types';

/**
 * Maps sports array to preferred sport enum
 * @param sports - Array of sport strings
 * @returns SportOptions enum value
 */
export function mapSportsToPreferredSport(sports: string[]): SportOptions {
  if (sports.includes('tennis') && sports.includes('pickleball')) {
    return SportOptions.BOTH;
  } else if (sports.includes('pickleball')) {
    return SportOptions.PICKLEBALL;
  } else {
    return SportOptions.TENNIS;
  }
}
