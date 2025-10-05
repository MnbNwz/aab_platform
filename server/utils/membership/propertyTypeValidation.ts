/**
 * Property Type Validation Utilities
 *
 * Property type hierarchy:
 * - "domestic": Only domestic properties
 * - "commercial": Commercial properties + all domestic benefits (includes everything)
 */

export type PropertyType = "domestic" | "commercial";

/**
 * Check if a membership plan allows access to a specific property type
 * @param membershipPropertyType - The property type allowed by membership
 * @param requestedPropertyType - The property type being requested
 * @returns boolean - Whether access is allowed
 */
export function hasPropertyTypeAccess(
  membershipPropertyType: PropertyType,
  requestedPropertyType: "domestic" | "commercial",
): boolean {
  switch (membershipPropertyType) {
    case "domestic":
      // Domestic membership only allows domestic properties
      return requestedPropertyType === "domestic";

    case "commercial":
      // Commercial membership allows both commercial AND domestic properties
      return requestedPropertyType === "domestic" || requestedPropertyType === "commercial";

    default:
      return false;
  }
}

/**
 * Get the display name for property type access
 * @param propertyType - The property type
 * @returns string - Human readable description
 */
export function getPropertyTypeDisplayName(propertyType: PropertyType): string {
  switch (propertyType) {
    case "domestic":
      return "1 property (Domestic)";
    case "commercial":
      return "Multiple properties (Domestic + Commercial)";
    default:
      return "Unknown property type";
  }
}

/**
 * Check if a membership plan allows multiple properties
 * @param maxProperties - Maximum properties allowed (null = unlimited)
 * @param propertyType - The property type access level
 * @returns boolean - Whether multiple properties are allowed
 */
export function allowsMultipleProperties(
  maxProperties: number | null,
  propertyType: PropertyType,
): boolean {
  // If maxProperties is null, unlimited properties are allowed
  if (maxProperties === null) return true;

  // If maxProperties is 1, only single property is allowed
  if (maxProperties === 1) return false;

  // If maxProperties > 1, multiple properties are allowed
  return maxProperties > 1;
}
