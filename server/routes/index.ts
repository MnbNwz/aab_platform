import { Router, Request, Response } from "express";
import { autoRefreshToken } from "@middlewares/autoRefresh";

const router = Router();

import userRoutes from "@routes/user";
import authRoutes from "@routes/auth";
import adminRoutes from "@routes/admin";
import membershipRoutes from "@routes/membership";
import serviceRoutes from "@routes/service";
import jobRequestRoutes from "@routes/jobRequest";
import propertyRoutes from "@routes/property";
import bidRoutes from "@routes/bid";
import contractorRoutes from "@routes/contractor";
import paymentRoutes from "@routes/payment";
import leadRoutes from "@routes/lead";
import { authenticate } from "@middlewares/auth";

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
router.use("/bid", bidRoutes);
router.use("/contractor", contractorRoutes);
router.use("/payment", paymentRoutes);
router.use("/leads", leadRoutes);

// Example route
router.get("/", (req: Request, res: Response) => {
  res.json({ message: "API Root" });
});

export default router;
