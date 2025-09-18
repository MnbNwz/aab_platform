import express from "express";
import { authenticate } from "@middlewares/auth";
import { requireRole } from "@middlewares/rbac";
import {
  getAllPlansController,
  getPlansByUserTypeController,
  getCurrentMembershipController,
  purchaseMembershipController,
  cancelMembershipController,
  getMembershipHistoryController,
  getMembershipStatsController,
} from "@controllers/membershipController";
import { createStripeSession } from "@controllers/stripeController";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Authenticated routes - user must be logged in
router.get("/plans", getAllPlansController);
router.get("/plans/:userType", getPlansByUserTypeController);
router.get("/current", getCurrentMembershipController);
router.post("/checkout", createStripeSession);
router.post("/purchase", purchaseMembershipController);
router.post("/cancel", cancelMembershipController);
router.get("/history", getMembershipHistoryController);

// Admin routes
router.get("/stats", requireRole(["admin"]), getMembershipStatsController);

export default router;
