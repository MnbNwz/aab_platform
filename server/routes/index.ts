import { Router, Request, Response } from "express";

const router = Router();

import userRoutes from "./user";

router.use("/users", userRoutes);

// Example route
router.get("/", (req: Request, res: Response) => {
  res.json({ message: "API Root" });
});

export default router;
