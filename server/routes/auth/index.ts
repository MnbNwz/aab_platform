// Combine auth-related routes
import authRouter from "./auth";
import userRouter from "./user";
import { Router } from "express";

const router = Router();

// Mount auth routes
router.use("/", authRouter);
router.use("/", userRouter);

export default router;
