import { Router, Request, Response } from "express";

const router = Router();

// Example route
router.get("/", (req: Request, res: Response) => {
  res.json({ message: "API Root" });
});

export default router;
