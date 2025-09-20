import { Router } from "express";
import userRoutes from "@routes/admin/user";
import serviceRoutes from "@routes/admin/service";

const router = Router();

router.use("/users", userRoutes);
router.use("/services", serviceRoutes);

export default router;
