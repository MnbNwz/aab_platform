import { Router, Request, Response } from "express";
import { autoRefreshToken } from "@middlewares/auth";
import authRoutes from "@routes/auth";
import adminRoutes from "@routes/admin";
import membershipRoutes from "@routes/membership";
import jobRoutes from "@routes/job";
import propertyRoutes from "@routes/property";
import paymentRoutes from "@routes/payment";
import dashboardRoutes from "@routes/dashboard";
import { authenticate } from "@middlewares/auth";
import serviceRoutes from "@routes/admin/service";
import favoriteRoutes from "@routes/user/favorites";

const router = Router();

// Mount webhook routes FIRST (before authentication middleware)
// Webhooks need to be accessible without authentication
router.use("/payment", paymentRoutes);

// Apply auto-refresh middleware globally to all routes
// This will automatically refresh expired access tokens using refresh tokens
router.use("/auth", authRoutes);
router.use("/services", serviceRoutes);

router.use(autoRefreshToken);
router.use(authenticate);

router.use("/user", authRoutes);
router.use("/favorites", favoriteRoutes); // Favorite contractors
router.use("/admin", adminRoutes);
router.use("/membership", membershipRoutes);
router.use("/job", jobRoutes); // All job-related routes under /job
router.use("/property", propertyRoutes);
router.use("/dashboard", dashboardRoutes); // Dashboard and analytics

// Example route
router.get("/", (req: Request, res: Response) => {
  res.json({ message: "API Root" });
});

export default router;
