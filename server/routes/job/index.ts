// Combine job-related routes
import jobRequestRouter from "./jobRequest";
import bidRouter from "./bid";
import contractorRouter from "./contractor";
import { Router } from "express";

const router = Router();

// Mount job routes with specific paths
router.use("/requests", jobRequestRouter);
router.use("/bids", bidRouter);
router.use("/contractor", contractorRouter);

export default router;
