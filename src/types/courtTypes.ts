/**
 * Court-related types for the Match Point League system
 */

import { SportOptions } from './userTypes';

/**
 * Complete court type representing a court in the Match Point League system.
 * This type includes all court information stored in the database.
 */
export interface Court {
  id: string;
  name: string;
  address_line: string;
  city: string;
  state: string;
  zip_code: string;
  is_indoor: boolean;
  lights?: boolean; // Only applies to outdoor courts; null if indoor
  sport: SportOptions;
  verified: boolean;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Public court response type for API endpoints
 * This type includes only the fields that should be visible to public users
 */
export interface PublicCourtResponse {
  name: string;
  address_line: string;
  city: string;
  state: string;
  zip_code: string;
  is_indoor: boolean;
  lights?: boolean;
  sport: SportOptions;
}

/**
 * Input type for creating a new court.
 * This type includes all required and optional fields needed to register a new court.
 */
export interface CreateCourtInput {
  name: string;
  address_line: string;
  city: string;
  state: string;
  zip_code: string;
  is_indoor: boolean;
  lights?: boolean;
  sport: SportOptions;
  verified?: boolean;
  created_by: string;
}

/**
 * Input type for updating an existing court.
 * All fields are optional since users may want to update only specific information.
 */
export interface UpdateCourtInput {
  name?: string;
  address_line?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  is_indoor?: boolean;
  lights?: boolean;
  sport?: SportOptions;
  verified?: boolean;
}
