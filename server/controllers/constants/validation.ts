// Validation constants for controllers

// Job request types
export const ALLOWED_JOB_TYPES = ["regular", "off_market", "commercial"];

// User types
export const ALLOWED_USER_TYPES = ["customer", "contractor"];

// Allowed domains for Stripe redirects
export const ALLOWED_STRIPE_DOMAINS = [
  "localhost",
  "127.0.0.1",
  "aasquebec.com",
  "app.aasquebec.com",
];

// Controller error messages
export const CONTROLLER_ERROR_MESSAGES = {
  AUTHENTICATION_REQUIRED: "Authentication required",
  JOB_REQUEST_NOT_FOUND: "Job request not found",
  BID_NOT_FOUND: "Bid not found",
  INTERNAL_SERVER_ERROR: "Internal server error",
  INSUFFICIENT_PERMISSIONS: "Only the job creator can accept bids",
  JOB_NO_LONGER_ACCEPTING_BIDS: "Job request is no longer accepting bids",
  BID_ALREADY_PLACED: "You have already placed a bid on this job",
  MISSING_REQUIRED_FIELDS: "Job request ID, bid amount, message, and timeline are required",
  BID_AMOUNT_MUST_BE_POSITIVE: "Bid amount must be a positive number",
  START_END_DATE_REQUIRED: "Start date and end date are required",
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
  BID_CREATION_ERROR: "Error creating bid",
  BID_FETCH_ERROR: "Error fetching bids",
  BID_ACCEPTED_SUCCESS: "Bid accepted successfully",
  BID_ACCEPT_ERROR: "Error accepting bid",
  CONTRACTOR_BID_FETCH_ERROR: "Error fetching contractor bids",
  JOB_CREATION_ERROR: "Error creating job request",
  JOB_CREATION_FAILED: "Failed to create job request",
  JOB_FETCH_ERROR: "Error fetching job requests",
  JOB_FETCH_FAILED: "Failed to fetch job requests",
  JOB_NOT_FOUND: "Job not found",
  JOB_REQUEST_FETCH_ERROR: "Error fetching job request",
  JOB_REQUEST_FETCH_FAILED: "Failed to fetch job request",
  JOB_UPDATE_ERROR: "Error updating job request",
  JOB_UPDATE_FAILED: "Failed to update job request",
  JOB_CANCELLED_SUCCESS: "Job cancelled successfully",
  JOB_CANCEL_ERROR: "Error cancelling job request",
  JOB_CANCEL_FAILED: "Failed to cancel job request",
  ADMIN_ONLY_OFF_MARKET: "Only admin can create off-market jobs",
  FORBIDDEN: "Forbidden",
  LEAD_FETCH_ERROR: "Error getting contractor leads",
  LEAD_ACCESS_ERROR: "Error accessing job request",
  LEAD_USAGE_ERROR: "Error getting lead usage",
  LEAD_CHECK_ERROR: "Error checking job access",
} as const;

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Controller constants for status values and types
export const CONTROLLER_CONSTANTS = {
  OPEN_STATUS: "open",
  INPROGRESS_STATUS: "inprogress",
  ACCEPTED_STATUS: "accepted",
  REJECTED_STATUS: "rejected",
  PENDING_STATUS: "pending",
  NUMBER_TYPE: "number",
  STRING_TYPE: "string",
  UNAUTHORIZED_MESSAGE: "Unauthorized",
} as const;

// Field constants for database queries
export const FIELD_CONSTANTS = {
  NAME: "name",
  EMAIL: "email",
  PHONE: "phone",
  TITLE: "title",
  DESCRIPTION: "description",
  STATUS: "status",
  STRING_TYPE: "string",
} as const;
