import { Router } from "express";
import * as serviceController from "../controllers/service";
import { authenticate } from "../middlewares/auth";
import { requireAdmin } from "../middlewares/admin";

const router = Router();

// Public routes
router.get("/", serviceController.getServices);

// Protected routes (admin only)
router.post("/", authenticate, requireAdmin, serviceController.createServices);

export default router;
