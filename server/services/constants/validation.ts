// Validation and filtering constants for services

// Job request validation
export const VALID_SORT_FIELDS = ["createdAt", "updatedAt", "title", "estimate", "status"];

export const ALLOWED_JOB_UPDATE_FIELDS = [
  "title",
  "description",
  "service",
  "estimate",
  "propertyType",
  "location",
  "status",
  "notes",
];

// User profile validation
export const ALLOWED_USER_UPDATE_FIELDS = [
  "firstName",
  "lastName",
  "phone",
  "companyName",
  "licenseNumber",
  "insuranceInfo",
  "bio",
  "specialties",
];

// Auth cooldown settings
export const AUTH_COOLDOWN_MINUTES = 5;
