/**
 * Service for handling ZIP code lookups and city information
 */

interface ZipCodeResponse {
  places?: Array<{
    'place name': string;
    'state abbreviation': string;
  }>;
}

export class ZipCodeService {
  /**
   * Fetches city and state information from a ZIP code
   */
  public static async getCityFromZipCode(zipCode: string): Promise<{ city: string; state: string; fullLocation: string } | null> {
    if (!zipCode || zipCode.length !== 5) {
      return null;
    }

    try {
      const response = await fetch(`https://api.zippopotam.us/US/${zipCode}`);
      
      if (!response.ok) {
        return null;
      }

      const data = await response.json() as ZipCodeResponse;
      
      if (!data.places || data.places.length === 0) {
        return null;
      }

      const place = data.places[0];
      const city = place['place name'];
      const state = place['state abbreviation'];

      return {
        city,
        state,
        fullLocation: `${city}, ${state}`
      };
    } catch (error) {
      console.error('Error fetching ZIP code data:', error);
      return null;
    }
  }

  /**
   * Validates ZIP code format
   */
  public static validateZipCodeFormat(zipCode: string): boolean {
    const zipRegex = /^\d{5}(-\d{4})?$/;
    return zipRegex.test(zipCode);
  }
} 