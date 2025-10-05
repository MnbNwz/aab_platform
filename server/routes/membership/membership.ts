import express from "express";
import { authenticate } from "@middlewares/auth";
import { requireRole } from "@middlewares/authorization";
import {
  getAllPlansController,
  getPlansByUserTypeController,
  getCurrentMembershipController,
  getMembershipHistoryController,
  getMembershipStatsController,
} from "@controllers/membership";
import { createStripeSession, toggleAutoRenewal } from "@controllers/payment";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Authenticated routes - user must be logged in
router.get("/plans", getAllPlansController);
router.get("/plans/:userType", getPlansByUserTypeController);
router.get("/current", getCurrentMembershipController);
router.post("/checkout", createStripeSession);
router.post("/toggle-auto-renewal", toggleAutoRenewal);
router.get("/history", getMembershipHistoryController);

// Admin routes
router.get("/stats", requireRole(["admin"]), getMembershipStatsController);

export default router;
