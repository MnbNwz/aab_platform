import express from "express";
import { authenticate } from "@middlewares/auth";
import { requireRole } from "@middlewares/authorization";
import {
  validateMembershipCheckout,
  validateJobPayment,
  validateOffMarketPayment,
} from "@middlewares/validation";
import {
  // Membership payments
  createMembershipCheckout,
  confirmMembershipPayment,
  cancelMembership,

  // Job payments
  createJobPayment,
  processJobDeposit,
  processJobPreStart,
  processJobCompletion,
  processJobRefund,

  // Off-market payments
  createOffMarketPayment,
  processOffMarketDeposit,
  requestFinancing,
  processFinancingPayment,
  processOffMarketRefund,

  // Stripe Connect
  setupContractorConnect,
  getContractorDashboard,
  getConnectStatus,

  // Payment management
  getPaymentHistory,
  getPaymentDetails,
  getPaymentStats,

  // Webhooks
  handleStripeWebhook,
} from "@controllers/payment";

const router = express.Router();

// ==================== MEMBERSHIP PAYMENTS ====================

// Create membership checkout session
router.post(
  "/membership/checkout",
  authenticate,
  validateMembershipCheckout,
  createMembershipCheckout,
);

// Confirm membership payment (webhook handled)
router.post("/membership/confirm", authenticate, confirmMembershipPayment);

// Cancel membership
router.post("/membership/cancel", authenticate, cancelMembership);

// ==================== JOB PAYMENTS ====================

// Create job payment record
router.post(
  "/job/create",
  authenticate,
  requireRole(["customer"]),
  validateJobPayment,
  createJobPayment,
);

// Process job deposit (15%)
router.post("/job/deposit", authenticate, requireRole(["customer"]), processJobDeposit);

// Process pre-start payment (25%)
router.post("/job/prestart", authenticate, requireRole(["customer"]), processJobPreStart);

// Process completion payment (60%)
router.post("/job/completion", authenticate, requireRole(["customer"]), processJobCompletion);

// Process job refund
router.post("/job/refund", authenticate, requireRole(["customer", "admin"]), processJobRefund);

// ==================== OFF-MARKET PAYMENTS ====================

// Create off-market payment
router.post(
  "/offmarket/create",
  authenticate,
  requireRole(["contractor"]),
  validateOffMarketPayment,
  createOffMarketPayment,
);

// Process off-market deposit
router.post(
  "/offmarket/deposit",
  authenticate,
  requireRole(["contractor"]),
  processOffMarketDeposit,
);

// Request financing for off-market
router.post(
  "/offmarket/financing/request",
  authenticate,
  requireRole(["contractor"]),
  requestFinancing,
);

// Process financing payment
router.post(
  "/offmarket/financing/pay",
  authenticate,
  requireRole(["contractor"]),
  processFinancingPayment,
);

// Process off-market refund
router.post(
  "/offmarket/refund",
  authenticate,
  requireRole(["contractor", "admin"]),
  processOffMarketRefund,
);

// ==================== STRIPE CONNECT ====================

// Setup contractor Stripe Connect
router.post("/connect/setup", authenticate, requireRole(["contractor"]), setupContractorConnect);

// Get contractor dashboard link
router.get("/connect/dashboard", authenticate, requireRole(["contractor"]), getContractorDashboard);

// Get connect status
router.get("/connect/status", authenticate, requireRole(["contractor"]), getConnectStatus);

// ==================== PAYMENT MANAGEMENT ====================

// Get payment history
router.get("/history", authenticate, getPaymentHistory);

// Get specific payment details
router.get("/:paymentId", authenticate, getPaymentDetails);

// Get payment statistics (admin only)
router.get("/stats/overview", authenticate, requireRole(["admin"]), getPaymentStats);

// ==================== WEBHOOKS ====================

// Stripe webhook endpoint (no auth required)
router.post("/webhook/stripe", handleStripeWebhook);

export default router;
