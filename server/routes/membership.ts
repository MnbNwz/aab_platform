import express from "express";
import { authenticate } from "../middlewares/auth";
import { requireRole } from "../middlewares/rbac";
import { MembershipController } from "../controllers/membershipController";

const router = express.Router();

// Public routes - get available plans
router.get("/plans", MembershipController.getAllPlans);
router.get("/plans/:userType", MembershipController.getPlansByUserType);

// Protected routes - require authentication
router.use(authenticate);

// User membership routes
router.get("/current", MembershipController.getCurrentMembership);
router.post("/purchase", MembershipController.purchaseMembership);
router.post("/cancel", MembershipController.cancelMembership);
router.get("/history", MembershipController.getMembershipHistory);

// Admin routes
router.get("/stats", requireRole(["admin"]), MembershipController.getMembershipStats);

export default router;
