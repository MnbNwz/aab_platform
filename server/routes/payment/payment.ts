import express from "express";
import { authenticate } from "@middlewares/auth";
import { requireRole } from "@middlewares/authorization";
import { validateJobPayment, validateOffMarketPayment } from "@middlewares/validation";
import {
  createJobPayment,
  processJobDeposit,
  processJobPreStart,
  processJobCompletion,
  processJobRefund,
  createOffMarketPayment,
  processOffMarketDeposit,
  requestFinancing,
  processFinancingPayment,
  processOffMarketRefund,
  setupContractorConnect,
  getContractorDashboard,
  getConnectStatus,
  getPaymentHistory,
  getPaymentDetails,
  getPaymentStats,
  handleStripeWebhook,
} from "@controllers/payment";

const router = express.Router();

// ==================== JOB PAYMENTS ====================
router.post(
  "/job/create",
  authenticate,
  requireRole(["customer"]),
  validateJobPayment,
  createJobPayment,
);

router.post("/job/deposit", authenticate, requireRole(["customer"]), processJobDeposit);
router.post("/job/prestart", authenticate, requireRole(["customer"]), processJobPreStart);
router.post("/job/completion", authenticate, requireRole(["customer"]), processJobCompletion);
router.post("/job/refund", authenticate, requireRole(["customer", "admin"]), processJobRefund);

// ==================== OFF-MARKET PAYMENTS ====================
router.post(
  "/offmarket/create",
  authenticate,
  requireRole(["contractor"]),
  validateOffMarketPayment,
  createOffMarketPayment,
);

router.post(
  "/offmarket/deposit",
  authenticate,
  requireRole(["contractor"]),
  processOffMarketDeposit,
);
router.post(
  "/offmarket/financing/request",
  authenticate,
  requireRole(["contractor"]),
  requestFinancing,
);
router.post(
  "/offmarket/financing/pay",
  authenticate,
  requireRole(["contractor"]),
  processFinancingPayment,
);
router.post(
  "/offmarket/refund",
  authenticate,
  requireRole(["contractor", "admin"]),
  processOffMarketRefund,
);

// ==================== STRIPE CONNECT ====================
router.post("/connect/setup", authenticate, requireRole(["contractor"]), setupContractorConnect);
router.get("/connect/dashboard", authenticate, requireRole(["contractor"]), getContractorDashboard);
router.get("/connect/status", authenticate, requireRole(["contractor"]), getConnectStatus);

// ==================== PAYMENT MANAGEMENT ====================
router.get("/history", authenticate, getPaymentHistory);
router.get("/:paymentId", authenticate, getPaymentDetails);
router.get("/stats/overview", authenticate, requireRole(["admin"]), getPaymentStats);

// ==================== WEBHOOKS ====================
router.post("/webhook/stripe", handleStripeWebhook);

export default router;
