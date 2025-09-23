import { Router } from "express";
import userRoutes from "@routes/admin/user";

const router = Router();

router.use("/users", userRoutes);

export default router;
