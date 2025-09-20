import { Router, Request, Response } from "express";
import { autoRefreshToken } from "@middlewares/autoRefresh";

const router = Router();

// Import organized route modules
import authRoutes from "./auth";
import adminRoutes from "./admin";
import membershipRoutes from "./membership";
import jobRoutes from "./job";
import propertyRoutes from "./property";
import paymentRoutes from "./payment";
import { authenticate } from "@middlewares/auth";

// Apply auto-refresh middleware globally to all routes
// This will automatically refresh expired access tokens using refresh tokens
router.use("/auth", authRoutes);

router.use(autoRefreshToken);
router.use(authenticate);

// Use organized route modules
router.use("/user", authRoutes); // user routes are in auth folder
router.use("/admin", adminRoutes);
router.use("/membership", membershipRoutes);
router.use("/jobRequest", jobRoutes); // jobRequest routes are in job folder
router.use("/property", propertyRoutes);
router.use("/bid", jobRoutes); // bid routes are in job folder
router.use("/contractor", jobRoutes); // contractor routes are in job folder
router.use("/payment", paymentRoutes);
router.use("/leads", jobRoutes); // lead routes are in job folder

// Example route
router.get("/", (req: Request, res: Response) => {
  res.json({ message: "API Root" });
});

export default router;
