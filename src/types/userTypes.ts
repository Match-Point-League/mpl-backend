/**
 * Enum representing the sports that users can prefer in the Match Point League application.
 * This enum defines the available sport options for user profiles.
 */
export enum SportOptions {
  TENNIS = 'tennis',
  PICKLEBALL = 'pickleball',
  BOTH = 'both',
}

/**
 * This enum defines the available role options for user accounts.
 */
export enum UserRole {
  PLAYER = 'player',
  ADMIN = 'admin',
  SUPERADMIN = 'superadmin'
}

/**
 * Complete user profile type representing a user in the Match Point League system.
 * This type includes all user information stored in the database.
 */
export type User = {
  id: string;
  email: string;
  name: string;
  display_name: string;
  skill_level: number;  // 1.0 - 5.5
  preferred_sport: SportOptions;
  is_competitive: boolean;
  city: string;
  zip_code: string;
  allow_direct_contact: boolean;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

/**
 * Input type for creating a new user account.
 * This type includes all required and optional fields needed to register a new user.
 */
export type CreateUserInput = {
  email: string;
  name: string;
  display_name: string;
  skill_level: number;
  preferred_sport: SportOptions;
  is_competitive: boolean;
  city: string;
  zip_code: string;
  allow_direct_contact?: boolean;
  role: UserRole;
}

/**
 * Input type for updating an existing user profile.
 * All fields are optional since users may want to update only specific information.
 */
export type UpdateUserInput = {
  name?: string;
  display_name?: string;
  skill_level?: number;
  preferred_sport?: SportOptions;
  is_competitive?: boolean;
  city?: string;
  zip_code?: string;
  allow_direct_contact?: boolean;
  role?: UserRole;
}

/**
 * Public user profile type representing a user in the Match Point League system.
 * This type includes all publicly available user information.
 */
export type PublicUser = {
  id: string;
  email?: string;
  display_name: string;
  skill_level: number;
  preferred_sport: SportOptions;
  is_competitive: boolean;
  city: string;
  zip_code: string;
}