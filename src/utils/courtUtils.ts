import database from '../config/database';

/**
 * Utility function to fetch courts by verification status
 * @param verified - Boolean indicating whether to fetch verified or unverified courts
 * @param includeCreatorInfo - Boolean indicating whether to include creator information (defaults to false for privacy)
 * @returns Promise<Array> - Array of courts with optional creator information
 */
export async function fetchCourtsByVerifiedStatus(
  verified: boolean, 
  includeCreatorInfo: boolean = false
): Promise<any[]> {
  const db = database.getPool();
  
  if (includeCreatorInfo) {
    // Admin endpoint: Include creator information with JOIN
    const result = await db.query(
      `SELECT court.id, court.name, court.address_line, court.city, court.state, court.zip_code, court.is_indoor, court.lights, court.sport, court.created_by,
              user.name as creator_name, user.email as creator_email
       FROM courts court
       LEFT JOIN users user ON court.created_by = user.id
       WHERE court.verified = $1`,
      [verified]
    );
    return result.rows;
  } else {
    // Public/Auth endpoint: Basic query without creator information
    const result = await db.query(
      'SELECT id, name, address_line, city, state, zip_code, is_indoor, lights, sport FROM courts WHERE verified = $1',
      [verified]
    );
    return result.rows;
  }
}
