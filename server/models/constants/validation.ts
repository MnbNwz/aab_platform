// Model Validation Constants
// This file contains all numeric constants, limits, and validation rules
// used across different models

// Image and file limits
export const MAX_PROPERTY_IMAGES = 15;

// Default values
export const DEFAULT_ANNUAL_DISCOUNT_RATE = 15; // 15% discount
export const DEFAULT_MEMBERSHIP_DURATION_DAYS = 30; // 30 days default
export const DEFAULT_SERVICE_VERSION = 1;
export const DEFAULT_COOLDOWN_SECONDS = 0;

// Currency and pricing
export const DEFAULT_CURRENCY = "usd";

// Location defaults
export const DEFAULT_LOCATION_TYPE = "Point";

// Validation messages
export const VALIDATION_MESSAGES = {
  MAX_IMAGES_EXCEEDED: "Maximum 15 images allowed",
} as const;
