  /**
   * Validates the lights field based on indoor/outdoor status
   * @param isIndoor - Whether the court is indoor
   * @param lights - The lights value to validate
   * @returns Error message if validation fails, undefined if valid
   */
  export function validateLightsField(isIndoor: boolean, lights: boolean | undefined): string | undefined {
    if (isIndoor && lights !== undefined) {
      return 'Lights field is not applicable for indoor courts';
    }
    
    if (!isIndoor && (lights === undefined || lights === null)) {
      return 'Lights field is required for outdoor courts';
    }
    
    return undefined; // Validation passed
  }