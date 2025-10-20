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
