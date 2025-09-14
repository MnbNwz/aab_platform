import { Router, Request, Response } from "express";
import { autoRefreshToken } from "../middlewares/autoRefresh";

const router = Router();

import userRoutes from "./user";
import authRoutes from "./auth";
import adminRoutes from "./admin";
import membershipRoutes from "./membership";
import serviceRoutes from "./service";
import jobRequestRoutes from "./jobRequest";
import propertyRoutes from "./property";
import { authenticate } from "@/middlewares";

// Apply auto-refresh middleware globally to all routes
// This will automatically refresh expired access tokens using refresh tokens
router.use("/services", serviceRoutes);
router.use("/auth", authRoutes);

router.use(autoRefreshToken);
router.use(authenticate);

router.use("/user", userRoutes);
router.use("/admin", adminRoutes);
router.use("/membership", membershipRoutes);
router.use("/jobRequest", jobRequestRoutes);
router.use("/property", propertyRoutes);

// Example route
router.get("/", (req: Request, res: Response) => {
  res.json({ message: "API Root" });
});

export default router;
