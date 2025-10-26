import express from "express";
import { authenticate } from "@middlewares/auth";
import { requireRole } from "@middlewares/authorization";
import { validateJobPayment } from "@middlewares/validation";
import {
  createJobPayment,
  processJobDeposit,
  processJobPreStart,
  processJobCompletion,
  processJobRefund,
  setupContractorConnect,
  getContractorDashboard,
  getConnectStatus,
  getPaymentHistory,
  getPaymentDetails,
  getPaymentStats,
  handleStripeWebhook,
  createJobPaymentCheckout,
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
router.post("/job/checkout", authenticate, requireRole(["customer"]), createJobPaymentCheckout);
router.post("/job/prestart", authenticate, requireRole(["customer"]), processJobPreStart);
router.post("/job/completion", authenticate, requireRole(["customer"]), processJobCompletion);
router.post("/job/refund", authenticate, requireRole(["customer", "admin"]), processJobRefund);

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
