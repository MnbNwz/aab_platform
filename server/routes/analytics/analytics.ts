import { Router } from "express";
import { authenticate } from "@middlewares/auth";
import { requireAdmin } from "@middlewares/authorization";
import { getAnalyticsController } from "@controllers/analytics";

const router = Router();

// All analytics routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// Single analytics endpoint - returns comprehensive business intelligence
router.get("/", getAnalyticsController);

export default router;
