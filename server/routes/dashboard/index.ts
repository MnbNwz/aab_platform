import { Router } from "express";
import dashboardRoutes from "./dashboard";

const router = Router();

// Mount dashboard routes directly (no nested /dashboard)
router.use("/", dashboardRoutes);

export default router;
