// Combine job-related routes
import jobRequestRouter from "./jobRequest";
import leadRouter from "./lead";
import bidRouter from "./bid";
import contractorRouter from "./contractor";
import { Router } from "express";

const router = Router();

// Mount job routes
router.use("/", jobRequestRouter);
router.use("/", leadRouter);
router.use("/", bidRouter);
router.use("/", contractorRouter);

export default router;
