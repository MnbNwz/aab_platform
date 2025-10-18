import { Router, Request, Response } from "express";
import { autoRefreshToken } from "@middlewares/auth";
import authRoutes from "@routes/auth";
import adminRoutes from "@routes/admin";
import membershipRoutes from "@routes/membership";
import jobRoutes from "@routes/job";
import propertyRoutes from "@routes/property";
import paymentRoutes from "@routes/payment";
import dashboardRoutes from "@routes/dashboard";
import investmentRoutes from "@routes/investment";
import analyticsRoutes from "@routes/analytics";
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

// Public endpoint to fetch all user memberships
router.get("/user-memberships", async (req: Request, res: Response) => {
  try {
    const { UserMembership } = await import("@models/user/userMembership");

    const memberships = await UserMembership.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: memberships.length,
      data: memberships,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch user memberships",
      error: error.message,
    });
  }
});

router.use(autoRefreshToken);
router.use(authenticate);

router.use("/user", authRoutes);
router.use("/favorites", favoriteRoutes); // Favorite contractors
router.use("/admin", adminRoutes);
router.use("/membership", membershipRoutes);
router.use("/job", jobRoutes); // All job-related routes under /job
router.use("/property", propertyRoutes);
router.use("/investment", investmentRoutes); // Investment opportunities with role-based access
router.use("/dashboard", dashboardRoutes); // Quick health check dashboard
router.use("/analytics", analyticsRoutes); // Comprehensive business analytics (admin only)

// Example route
router.get("/", (req: Request, res: Response) => {
  res.json({ message: "API Root" });
});

export default router;
