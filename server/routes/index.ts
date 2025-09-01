import { Router, Request, Response } from "express";

const router = Router();

import userRoutes from "./user";
import authRoutes from "./auth";
import adminRoutes from "./admin";

router.use("/users", userRoutes);
router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);

// Example route
router.get("/", (req: Request, res: Response) => {
  res.json({ message: "API Root" });
});

export default router;
