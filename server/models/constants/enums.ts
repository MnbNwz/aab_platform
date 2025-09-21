// Model Enum Constants
// This file contains all enum values used across different models
// for consistent validation and type safety

// User-related enums
export const USER_ROLES = ["admin", "customer", "contractor"] as const;
export const USER_STATUSES = ["pending", "active", "revoke"] as const;
export const APPROVAL_STATUSES = ["pending", "approved", "rejected"] as const;
export const PROPERTY_TYPES = ["domestic", "commercial"] as const;

// Contractor-related enums
export const STRIPE_CONNECT_STATUSES = ["pending", "active", "rejected", "disabled"] as const;

// Job-related enums
export const JOB_TYPES = ["regular", "off_market", "commercial"] as const;
export const JOB_STATUSES = ["open", "inprogress", "hold", "completed", "cancelled"] as const;
export const JOB_PAYMENT_STATUSES = [
  "pending",
  "deposit_paid",
  "prestart_paid",
  "completed",
  "refunded",
] as const;
export const BID_STATUSES = ["pending", "accepted", "rejected"] as const;
export const JOB_PAYMENT_STAGES = ["pending", "in_progress", "completed", "cancelled"] as const;
export const MILESTONE_STATUSES = ["pending", "completed"] as const;

// Payment-related enums
export const PAYMENT_STATUSES = ["pending", "succeeded", "failed"] as const;
export const PAYMENT_STAGE_STATUSES = ["pending", "paid", "failed", "refunded"] as const;
export const BILLING_PERIODS = ["monthly", "yearly"] as const;
export const BILLING_TYPES = ["recurring", "one_time"] as const;
export const OFF_MARKET_PAYMENT_STATUSES = [
  "pending",
  "deposit_paid",
  "financing_approved",
  "completed",
  "cancelled",
  "refunded",
] as const;
export const UNDERWRITING_STATUSES = ["pending", "approved", "rejected"] as const;

// Membership-related enums
export const MEMBERSHIP_TIERS = ["basic", "standard", "premium"] as const;
export const USER_TYPES = ["customer", "contractor"] as const;
export const MEMBERSHIP_STATUSES = ["active", "expired", "canceled"] as const;

// Property-related enums
export const PROPERTY_TYPE_OPTIONS = ["apartment", "house", "villa"] as const;
export const LOCATION_TYPES = ["Point"] as const;
export const AREA_UNITS = ["sqft", "sqm", "marla", "kanal"] as const;

// Payment and currency constants
export const CURRENCIES = ["usd"] as const;
export const PAYMENT_TYPES = ["deposit", "prestart", "completion"] as const;

// Note: Type exports are handled in the individual type files to avoid conflicts
