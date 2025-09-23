import { Router } from "express";
import { authenticate } from "@middlewares/auth";
import { requireRole } from "@middlewares/authorization";
import { getPlatformDashboardController } from "@controllers/dashboard";

const router = Router();

// All analytics routes require authentication
router.use(authenticate);

// Single smart dashboard endpoint - returns role-based data automatically
// Admin: Complete platform analytics
// Customer: Their personal analytics
// Contractor: Their performance metrics
router.get("/", getPlatformDashboardController);

export default router;
