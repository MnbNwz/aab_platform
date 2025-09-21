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

// Service error messages
export const SERVICE_ERROR_MESSAGES = {
  STRIPE_CUSTOMER_ERROR: "Error creating/retrieving Stripe customer",
  PAYMENT_INTENT_ERROR: "Error creating payment intent",
  JOB_PAYMENT_ERROR: "Error creating job payment",
  JOB_PAYMENT_NOT_FOUND: "Job payment not found",
  DEPOSIT_PROCESSING_ERROR: "Error processing job deposit",
  DEPOSIT_NOT_PAID: "Job payment not found or deposit not paid",
  PRESTART_PROCESSING_ERROR: "Error processing pre-start payment",
  PRESTART_NOT_PAID: "Job payment not found or pre-start not paid",
  COMPLETION_PROCESSING_ERROR: "Error processing completion payment",
  COMPLETION_NOT_PAID: "Job payment not found or completion not paid",
  CONTRACTOR_NOT_FOUND: "Contractor not found or no Stripe Connect account",
  PAYOUT_PROCESSING_ERROR: "Error processing contractor payout",
  REFUND_PROCESSING_ERROR: "Error processing refund",
  OFF_MARKET_PAYMENT_ERROR: "Error creating off-market payment",
  CONTRACTOR_CONNECT_SETUP_ERROR: "Error setting up contractor connect",
  CONTRACTOR_DASHBOARD_ERROR: "Error getting contractor dashboard",
} as const;

// Service constants for status values and types
export const SERVICE_CONSTANTS = {
  CURRENCY: "usd",
  DEFAULT_JOB_STATUS: "pending",
  DEFAULT_PAYMENT_STATUS: "pending",
  DEFAULT_DEPOSIT_STATUS: "pending",
  DEFAULT_PRESTART_STATUS: "pending",
  DEFAULT_COMPLETION_STATUS: "pending",
  DEFAULT_STRIPE_CONNECT_STATUS: "pending",
  PAID_STATUS: "paid",
  COMPLETED_STATUS: "completed",
  DEPOSIT_TYPE: "deposit",
  PRESTART_TYPE: "prestart",
  COMPLETION_TYPE: "completion",
  PREMIUM_TIER: "premium",
  REQUESTED_BY_CUSTOMER: "requested_by_customer",
  OFF_MARKET_DEPOSIT: "off_market_deposit",
  EXPRESS_TYPE: "express",
  ACCOUNT_ONBOARDING: "account_onboarding",
  CONTRACTOR_CONNECT_SETUP_ERROR: "Error setting up contractor connect",
  CONTRACTOR_DASHBOARD_ERROR: "Error getting contractor dashboard",
} as const;
