// Validation constants
export const VALIDATION_CONSTANTS = {
  // Password validation
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  PASSWORD_REQUIREMENTS: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SYMBOLS: true,
  },

  // OTP validation
  OTP_LENGTH: 6,
  OTP_EXPIRY_MINUTES: 10,
  OTP_COOLDOWN_MINUTES: 1,

  // Phone validation
  PHONE_REGIONS: ["US", "CA", "GB", "AU"],

  // Email validation
  EMAIL_MAX_LENGTH: 254,
  EMAIL_RATE_LIMIT_PER_HOUR: 50,
  EMAIL_DEBOUNCE_SECONDS: 60,
  EMAIL_MAX_ATTEMPTS_PER_DAY: 10,

  // File upload validation
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],
  ALLOWED_DOCUMENT_TYPES: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
} as const;

// Financial constants
export const FINANCIAL_CONSTANTS = {
  DEPOSIT_PERCENTAGE: 15,
  CURRENCY_PRECISION: 2,
  MAX_AMOUNT: 99999999, // $999,999.99 in cents
  MIN_AMOUNT: 1, // $0.01 in cents
} as const;

// Date constants
export const DATE_CONSTANTS = {
  MEMBERSHIP_GRACE_PERIOD_DAYS: 7,
  PASSWORD_RESET_EXPIRY_HOURS: 1,
  EMAIL_VERIFICATION_EXPIRY_HOURS: 24,
} as const;

// AWS constants (S3 only - SES removed)
export const AWS_CONSTANTS = {
  S3_REGION: "ca-central-1",
  MAX_S3_RETRIES: 3,
  S3_TIMEOUT: 30000, // 30 seconds
} as const;
