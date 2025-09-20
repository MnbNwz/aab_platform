// Route paths and names constants

// Auth routes
export const AUTH_ROUTES = {
  LOGIN: "/login",
  REGISTER: "/register",
  LOGOUT: "/logout",
  REFRESH_TOKEN: "/refresh-token",
  VERIFY_EMAIL: "/verify-email",
  RESEND_OTP: "/resend-otp",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  GET_VERIFICATION_STATE: "/verification-state",
} as const;

// User routes
export const USER_ROUTES = {
  GET_BY_ID: "/:id",
  UPDATE: "/:id",
  DELETE: "/:id",
  GET_ADMINS: "/get-admins",
  CHANGE_PASSWORD: "/change-password",
} as const;

// Admin routes
export const ADMIN_ROUTES = {
  USERS: "/users",
  USER_STATS: "/users/stats",
  USER_BY_ID: "/users/:userId",
  UPDATE_USER: "/users/:userId",
  SERVICES: "/services",
} as const;

// Property routes
export const PROPERTY_ROUTES = {
  GET_BY_ID: "/:id",
  UPDATE: "/:id",
} as const;

// Job routes
export const JOB_ROUTES = {
  GET_BY_ID: "/:id",
  UPDATE_REQUEST: "/:id",
  CANCEL_REQUEST: "/:id/cancel",
} as const;

// Lead routes
export const LEAD_ROUTES = {
  ACCESS_JOB_REQUEST: "/:jobRequestId/access",
  GET_LEAD_USAGE: "/usage",
  CHECK_JOB_ACCESS: "/:jobRequestId/check-access",
} as const;

// Bid routes
export const BID_ROUTES = {
  GET_BID_BY_ID: "/:id",
  UPDATE_BID: "/:id",
  ACCEPT_BID: "/:id/accept",
  REJECT_BID: "/:id/reject",
} as const;

// Payment routes
export const PAYMENT_ROUTES = {
  MEMBERSHIP_CHECKOUT: "/membership/checkout",
  CONFIRM_MEMBERSHIP: "/membership/confirm",
  CANCEL_MEMBERSHIP: "/membership/cancel",
  CREATE_JOB_PAYMENT: "/job/create",
  JOB_DEPOSIT: "/job/:jobPaymentId/deposit",
  JOB_PRE_START: "/job/:jobPaymentId/pre-start",
  JOB_COMPLETION: "/job/:jobPaymentId/completion",
  JOB_REFUND: "/job/:jobPaymentId/refund",
  OFF_MARKET_CREATE: "/offmarket/create",
  OFF_MARKET_DEPOSIT: "/offmarket/:offMarketPaymentId/deposit",
  REQUEST_FINANCING: "/offmarket/:offMarketPaymentId/financing/request",
  PROCESS_FINANCING: "/offmarket/:offMarketPaymentId/financing/process",
  OFF_MARKET_REFUND: "/offmarket/:offMarketPaymentId/refund",
  CONTRACTOR_CONNECT: "/contractor/:contractorId/connect",
  CONTRACTOR_DASHBOARD: "/contractor/:contractorId/dashboard",
  CONTRACTOR_STATUS: "/contractor/:contractorId/status",
  PAYMENT_HISTORY: "/history",
  PAYMENT_DETAILS: "/:paymentId",
  PAYMENT_STATS: "/stats/overview",
  STRIPE_WEBHOOK: "/webhook/stripe",
} as const;

// Membership routes
export const MEMBERSHIP_ROUTES = {
  GET_ALL_PLANS: "/plans",
  GET_PLANS_BY_USER_TYPE: "/plans/:userType",
  GET_CURRENT_MEMBERSHIP: "/current",
  PURCHASE_MEMBERSHIP: "/purchase",
  CANCEL_MEMBERSHIP: "/cancel",
  GET_MEMBERSHIP_HISTORY: "/history",
  GET_MEMBERSHIP_STATS: "/stats",
  CREATE_STRIPE_SESSION: "/stripe/session",
} as const;

// Service routes - no specific paths needed (using "/" directly in route files)
export const SERVICE_ROUTES = {
  // All routes use "/" - defined directly in route files
} as const;

// Contractor routes
export const CONTRACTOR_ROUTES = {
  BIDS: "/bids",
  UPDATE_BID: "/bids/:bidId",
} as const;
