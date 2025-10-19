// Middleware validation constants

// File upload limits
export const FILE_UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB max for images
  MAX_DOCUMENT_SIZE: 10 * 1024 * 1024, // 10MB max for documents
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  ALLOWED_DOCUMENT_TYPES: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  ALLOWED_FILE_TYPES: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
} as const;

// Payment validation constants
export const PAYMENT_VALIDATION = {
  BILLING_PERIODS: ["monthly", "yearly"],
  REQUIRED_MEMBERSHIP_FIELDS: ["planId", "billingPeriod"],
  REQUIRED_JOB_PAYMENT_FIELDS: ["jobRequestId", "contractorId", "bidId", "totalAmount"],
  REQUIRED_OFF_MARKET_FIELDS: ["listingId", "listingPrice"],
} as const;

// Error messages
export const MIDDLEWARE_ERROR_MESSAGES = {
  AUTHENTICATION_REQUIRED: "Authentication required",
  INVALID_TOKEN: "Invalid token",
  USER_NOT_FOUND: "User not found",
  USER_REVOKED: "User account has been revoked",
  ADMIN_REQUIRED: "Admin access required",
  INSUFFICIENT_ROLE: "Forbidden: insufficient role",
  MISSING_REQUIRED_FIELDS: "Plan ID and billing period are required",
  INVALID_BILLING_PERIOD: "Billing period must be 'monthly' or 'yearly'",
  MISSING_JOB_PAYMENT_FIELDS:
    "Job request ID, contractor ID, bid ID, and total amount are required",
  MISSING_OFF_MARKET_FIELDS: "Listing ID and listing price are required",
  INVALID_DEPOSIT_PERCENTAGE: "Deposit percentage must be between 1 and 100",
  ACCOUNT_REVOKED: "Account has been revoked",
  AUTHENTICATION_ERROR: "Authentication error",
  INTERNAL_SERVER_ERROR: "Internal server error",
} as const;

// Authorization constants
export const AUTHORIZATION_CONSTANTS = {
  BEARER_PREFIX: "Bearer ",
  ACCESS_TOKEN_COOKIE: "accessToken",
  REFRESH_TOKEN_COOKIE: "refreshToken",
} as const;

// Environment and cookie constants
export const ENVIRONMENT_CONSTANTS = {
  REVOKE_STATUS: "revoke",
  COOKIE_SAMESITE: "none", // "none" for cross-subdomain cookies with secure flag
} as const;

// HTTP status codes
export const HTTP_STATUS = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  BAD_REQUEST: 400,
} as const;
